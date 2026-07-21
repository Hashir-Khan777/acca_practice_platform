import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz, AuditLog } from "@/lib/models";
import { getAuthUser } from "@/lib/jwt";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check user auth token
    const user = await getAuthUser(req);
    const userEmail = user?.email || 'anonymous@acca.ai';

    const { subject, topic, difficulty, numQuestions, questionType } = await req.json();

    if (!subject) {
      return NextResponse.json({ error: 'Subject parameter is required' }, { status: 400 });
    }

    const booksDirectory = path.join(process.cwd(), 'accabooks');

    if (!fs.existsSync(booksDirectory)) {
      return NextResponse.json({ error: 'accabooks folder not found on server' }, { status: 500 });
    }

    const allFiles = await fs.promises.readdir(booksDirectory);

    const matchingFiles = allFiles.filter(fileName => 
      fileName.toLowerCase().includes(subject.toLowerCase()) && fileName.endsWith('.pdf')
    );

    if (matchingFiles.length === 0) {
      return NextResponse.json({ error: `No books found matching the subject: ${subject}` }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return NextResponse.json({
        success: false,
        message: "Gemini API Key is not configured. Please set the GEMINI_API_KEY secret under Admin Settings > Secrets to generate practice questions.",
        data: {},
        errors: ["API Key missing"]
      }, { status: 400 });
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

    const uploadPromises = matchingFiles.map(async (fileName) => {
      const filePath = path.join(booksDirectory, fileName);
      
      const uploadedFile = await ai.files.upload({
        file: filePath,
        config: {
          mimeType: 'application/pdf',
          displayName: fileName
        }
      });
      return uploadedFile;
    });

    const uploadedFilesData = await Promise.all(uploadPromises);

    const fileParts = uploadedFilesData.map(file => ({
      fileData: {
        fileUri: file.uri,
        mimeType: file.mimeType
      }
    }));

    const prompt = `
==================================================
SYSTEM ROLE & OBJECTIVE
==================================================
You are an experienced ACCA Foundation examiner creating original, exam-standard practice questions for ${topic} in ${subject}.

- Generate EXACTLY ${numQuestions} JSON objects in a single JSON array.
- Output MUST be valid JSON only — no introductions, markdown code blocks around the JSON array, notes, or post-text.
- Do not copy wording, reference page numbers, or mention uploaded source files.

==================================================
QUESTION DISTRIBUTION & TYPES
==================================================
Compute exact counts (Total N = ${numQuestions}):
1. mcqCount = round(N * 0.5)
2. inputCount = round(N * 0.3)
3. excelCount = N - mcqCount - inputCount

Interleave types ('MCQ', 'Input', 'Excel') naturally across IDs 1 to N.

Question Type Specs:
- 'MCQ': Exactly 4 options. Realistic distractors reflecting common errors.
- 'Input': "options": []. Numeric answers calculated by the candidate.
- 'Excel': "options": []. MUST include a GFM pipe table AND an ASCII chart in a fenced code block. Both table and chart interpretation are required to solve.

==================================================
MARKDOWN & PARSER VALIDATION (react-markdown + remark-gfm)
==================================================
All Markdown generated inside JSON string fields MUST strictly comply with these rendering rules:
1. GFM Pipe Tables: Use standard | Header | syntax with a |---| separator row. Max 4 columns, 4 rows. Do not use literal | characters inside cell text.
2. Fenced Code Blocks: Wrap ASCII charts strictly in triple backticks (\`\`\`). Never nest code fences inside code fences.
3. Line Breaks & Blocks: Use \\n\\n inside JSON strings to separate paragraphs, tables, and code blocks so remark-gfm parses them as distinct blocks. Never use unescaped raw newlines.
4. Clean Text: Keep text inside the "question" field plain (no # headings or raw HTML tags <...> that break JSX parsing).
5. Strict JSON Escaping: All literal quotes inside JSON strings MUST be escaped as \\", and backslashes as \\\\.

==================================================
DIFFICULTY CALIBRATION (${difficulty})
==================================================
Apply parameters matching ${difficulty} strictly across all questions:

- Easy:
  * Length: 15–30 words (1–2 sentences).
  * English: Direct structures, active voice, foundational accounting terminology.
  * Task: Single-step recall, basic classification, or single-formula application.

- Medium:
  * Length: 30–60 words (2–4 sentences).
  * English: Standard professional business English, compound sentences.
  * Task: 2–3 step calculation or linking two concepts with one adjustment (e.g., accruals).

- Hard:
  * Length: 2–4 detailed paragraphs.
  * English: Advanced financial vocabulary, complex syntax.
  * Task: 5+ step calculation, synthesizing concepts, evaluating competing methods.

- Extreme:
  * Length: 6+ detailed paragraphs.
  * English: Dense technical narrative, corporate terminology, scenario-based phrasing.
  * Task: 10+ step case scenario, cross-syllabus integration, non-obvious methodology choice, with embedded irrelevant data.

==================================================
CORE CONSTRAINTS
==================================================
1. ZERO ANSWER LEAKAGE: "question" field must NEVER reveal the correct answer, show final worked steps, or label spreadsheet/chart values as solutions/results.
2. EXPLANATION: 1–3 concise sentences explaining why the correct answer is right. No full question restatements.
3. SILENT SELF-VALIDATION: Verify IDs are 1 to N, types match computed counts, JSON is valid, and "correct_answer" is always an array before outputting.

==================================================
OUTPUT SCHEMA
==================================================
[
  {
    "id": 1,
    "question": "",
    "options": [],
    "correct_answer": [],
    "explanation": "",
    "type": ""
  }
]
    `.trim();

    // Define fallback models in priority order
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let responseText = "";
    let finalModelUsed = "";
    let isFallbackTriggered = false;

    // Loop through defined models if rate limits or errors happen
    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [{
            parts: [
              { text: prompt },
              ...fileParts
            ]
          }],
          config: {
            temperature: 0.2,
            systemInstruction: `You are an experienced ACCA Foundation examiner creating original, exam-standard practice questions for ${topic} in ${subject}.
            - Generate EXACTLY ${numQuestions} JSON objects in a single JSON array.
            - Output MUST be valid JSON only — no introductions, markdown code blocks around the JSON array, notes, or post-text.
            - Do not copy wording, reference page numbers, or mention uploaded source files.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { 
                    type: Type.INTEGER, 
                    description: "Sequential question index starting strictly from 1" 
                  },
                  type: { 
                    type: Type.STRING, 
                    enum: ["MCQ", "Input", "Excel"],
                    description: "Must be strictly one of: MCQ, Input, or Excel" 
                  },
                  question: { 
                    type: Type.STRING, 
                    description: "The complete question scenario, table, or chart. DO NOT INCLUDE THE ANSWER OR SOLUTION HERE." 
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "4 options for MCQ/Excel-MCQ. MUST BE AN EMPTY ARRAY [] for Input type."
                  },
                  correct_answer: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array containing exact string matching the correct option or numeric answer."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "1-3 sentences explaining why the answer is correct based on ACCA standards."
                  }
                },
                required: ["id", "type", "question", "options", "correct_answer", "explanation"]
              }
            }
          }
        });

        if (response.text) {
          responseText = response.text;
          finalModelUsed = currentModel;
          isFallbackTriggered = i > 0; // If index > 0, fallback was used
          const deletePromises = uploadedFilesData.map((file: any) => 
            ai.files.delete({ name: file.name })
          );
          await Promise.all(deletePromises);
          break; // Exit loop successfully
        }
      } catch (modelError) {
        console.warn(`Model ${currentModel} failed or busy. Attempting fallback if available. Error:`, modelError);
        // If we're out of options, rethrow the error to hit the outer catch block
        if (i === modelsToTry.length - 1) {
          throw new Error(`All available Gemini models failed or were exhausted. Last error: ${modelError instanceof Error ? modelError.message : String(modelError)}`);
        }
      }
    }

    // Parsing the verified output string
    const parsedQuestions = JSON.parse(responseText.trim());

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
      details: `Generated AI Quiz: ${subject} - ${topic} using ${finalModelUsed}. Fallback run: ${isFallbackTriggered}`,
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
