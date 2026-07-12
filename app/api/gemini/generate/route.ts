import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz, AuditLog } from "@/lib/models";
import { MOCK_AI_QUESTIONS } from "@/lib/store";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check user auth token
    const authHeader = req.headers.get('authorization');
    let userEmail = 'anonymous@acca.ai';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      if (decoded) {
        userEmail = decoded.email;
      }
    }

    const { subject, topic, difficulty, numQuestions, questionType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not configured. Falling back to realistic pre-loaded questions.");
      
      const subKey = subject?.toLowerCase().includes("audit") ? "sub-aa" : "sub-fr";
      const mockQuestions = MOCK_AI_QUESTIONS[subKey] || MOCK_AI_QUESTIONS['sub-fr'];
      const sliced = mockQuestions.slice(0, numQuestions || 3);

      // Save fallback quiz to MongoDB for referencing quiz attempts
      const newQuiz = new Quiz({
        title: `${subject} - ${topic} Practice Exam (Offline Mode)`,
        subject,
        topic,
        difficulty,
        type: questionType || 'MCQ',
        questions: sliced,
        generatedBy: 'AI'
      });
      await newQuiz.save();

      return NextResponse.json({
        success: true,
        message: "Generated using realistic ACCA Syllabus offline fallback (Set GEMINI_API_KEY in Settings > Secrets to unlock live AI generator).",
        data: {
          quizId: newQuiz._id.toString(),
          questions: sliced,
          isFallback: true
        },
        errors: []
      });
    }

    // Initialize the Gemini SDK
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Generate a set of high-quality ACCA practice exam questions.
Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty}
Number of Questions: ${numQuestions || 3}
Question Type: ${questionType || 'MCQ'}

You must create realistic, rigorous ACCA questions that directly align with the ACCA official syllabus, guidelines, and international accounting/auditing standards.
Each question must include 4 distinct, plausible options, a list of correct answers (usually 1 option), a comprehensive, professional explanation referencing appropriate standards (e.g., IAS, IFRS, ISA, etc.), and the type.
`;

    let parsedQuestions = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an elite ACCA exam designer and accounting professor. You generate authentic, challenging exam questions. You always return responses in the requested JSON format and never output any markdown formatting, notes, preambles, or postscripts.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.INTEGER,
                    description: "Sequential question index starting from 1"
                  },
                  question: {
                    type: Type.STRING,
                    description: "The ACCA exam question text, scenarios, or calculations"
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of 4 distinct and realistic multiple choice answers"
                  },
                  correct_answer: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array containing the exact matching correct option text"
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A detailed professional explanation citing ACCA syllabus concepts and accounting/audit standards"
                  },
                  type: {
                    type: Type.STRING,
                    description: "The category of the question (e.g. single)"
                  }
                },
                required: ["id", "question", "options", "correct_answer", "explanation", "type"]
              }
            }
          }
        });

        const textOutput = response.text;
        if (!textOutput) {
          throw new Error("Empty response returned from Gemini API");
        }

        parsedQuestions = JSON.parse(textOutput.trim());
        break; // Parsing succeeded, exit loop
      } catch (err: any) {
        attempts++;
        console.warn(`JSON validation failed on attempt ${attempts}. Error: ${err.message}`);
        if (attempts >= maxAttempts) {
          throw new Error("Failed to receive a valid JSON schema from Gemini after multiple attempts.");
        }
      }
    }

    // Save generated quiz to MongoDB
    const newQuiz = new Quiz({
      title: `${subject} - ${topic} Practice Exam`,
      subject,
      topic,
      difficulty,
      type: questionType || 'MCQ',
      questions: parsedQuestions,
      generatedBy: 'AI'
    });
    await newQuiz.save();

    // Create Audit Log
    const audit = new AuditLog({
      user: userEmail,
      action: 'QUIZ_GENERATE',
      details: `Generated AI Quiz: ${subject} - ${topic} (${difficulty})`,
      timestamp: new Date()
    });
    await audit.save();

    return NextResponse.json({
      success: true,
      message: "AI Quiz generated successfully.",
      data: {
        quizId: newQuiz._id.toString(),
        questions: parsedQuestions,
        isFallback: false
      },
      errors: []
    });

  } catch (error: any) {
    console.error("AI Quiz generation failed:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate AI Quiz. Please try again.",
      data: {},
      errors: [error?.message || "Unknown error occurred"]
    }, { status: 500 });
  }
}
