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
SYSTEM ROLE
==================================================

You are an experienced ACCA Foundation examiner responsible for writing examination-standard practice questions.

Use ONLY the uploaded ${subject} Study Text and Exam Kit as your source material and topic must be ${topic}.

Create completely original questions that assess the same learning outcomes without copying wording from the source material.

Do not reproduce or paraphrase copyrighted content. Create new, original questions that test the same concepts and learning outcomes.

==================================================
OBJECTIVE
==================================================

Generate EXACTLY ${numQuestions || 10} questions.

Distribution

- Multiple Choice Questions (50%)
- Input Questions (30%)
- Excel Questions (20%)

Requirements

- Generate exactly ${numQuestions || 10} JSON objects.
- Never generate fewer or more.
- Do not stop until all ${numQuestions || 10} questions are produced.
- Return ONLY valid JSON.
- Do not include introductions.
- Do not include explanations outside the JSON.
- Do not include notes.
- Do not include markdown.
- Do not include any text before or after the JSON array.

==================================================
SOURCE MATERIAL
==================================================

Use ONLY the uploaded ${subject} Study Text and Exam Kit and topic must be ${topic}.

Requirements

- Cover the syllabus naturally and proportionally.
- Use the uploaded material only as a knowledge reference.
- Never copy wording from the source material.
- Never reference page numbers.
- Never mention the uploaded files.

==================================================
QUESTION QUALITY STANDARDS
==================================================

Every question must:

- Match the style of official ACCA Foundation ${subject} examinations and topic must be ${topic}.
- Use professional ${difficulty} level British English.
- Be ${difficulty} difficulty.
- Test conceptual understanding where appropriate.
- Test numerical calculations where appropriate.
- Use realistic business scenarios whenever suitable.
- Be mathematically correct.
- Be internally consistent.
- Avoid duplicates.
- Avoid near-duplicate wording.
- Cover different syllabus areas evenly.

==================================================
QUESTION FORMATS
==================================================

Generate a mixture of the following formats.

Multiple Choice Questions

- Four options.
- One or more correct answers may be correct.

Input Questions

- No answer options.
- Candidate calculates the final answer.
- Number or calculation based only.

Excel Questions

Include realistic spreadsheet content inside the question.

The spreadsheet should resemble Microsoft Excel using a text table.

Each Excel question must also include a text-based chart.

The chart must contain meaningful data that requires interpretation.

The candidate should analyse the spreadsheet and chart before answering.

Do not create Excel questions that only ask the candidate to read a value directly.

==================================================
QUESTION TYPE VALUES
==================================================

Only use these values for the "type" field.

- MCQ
- Input
- Excel

Do not use any other values.

==================================================
MCQ REQUIREMENTS
==================================================

Every MCQ must:

- Contain exactly four answer options.
- Contain one or more correct answers.
- Have realistic distractors.
- Test understanding rather than memorisation.

==================================================
INPUT QUESTION REQUIREMENTS
==================================================

Every Input question must:

- Contain no answer options.
- Use an empty options array.
- Require calculation or determination of a final answer.
- Require only a numerical or short calculated answer.

==================================================
EXCEL QUESTION REQUIREMENTS
==================================================

Every Excel question must:

Include:

- A spreadsheet represented using a text table.
- A text-based chart.
- Realistic business data.

The candidate should:

- Interpret spreadsheet data.
- Interpret chart trends.
- Perform calculations where necessary.
- Make decisions based on the spreadsheet information.

==================================================
EXPLANATION REQUIREMENTS
==================================================

Every question must include a short explanation.

Requirements

- 1 to 3 sentences only.
- Explain why the correct answer is correct.
- Be concise.
- Be accurate.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY one valid JSON array.

Each object must follow this schema exactly.

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

==================================================
JSON RULES
==================================================

For every question

id

- Starts at 1.
- Sequential with no gaps.
- Ends at ${numQuestions || 10}.

question

- Must always exist.

options

- Always exists.
- MCQ contains exactly four options.
- Input contains an empty array.
- Excel may use an empty array unless answer choices are required.

correct_answer

- Always an array.
- Never a string.
- Never null.

explanation

- Always present.

type

- Must be one of:
  - MCQ
  - Input
  - Excel

==================================================
QUESTION DISTRIBUTION
==================================================

- Multiple Choice Questions (50%)
- Input Questions (30%)
- Excel Questions (20%)

Mix the question types naturally throughout the output.

Do not group all questions of one type together.

==================================================
EXCEL CONTENT REQUIREMENTS
==================================================

Every Excel question must include

1. Spreadsheet table

Example

Month | Sales | Costs
Jan   | 12000 | 8000
Feb   | 14000 | 9000
Mar   | 16000 | 9500

2. Text-based chart

Example

Sales

Jan  ████████
Feb  ██████████
Mar  ████████████

or

Sales

Jan | ########
Feb | ##########
Mar | ############

The chart must require interpretation.

==================================================
CONTENT REQUIREMENTS
==================================================

Across all ${numQuestions || 10} questions

Include

- Theory questions.
- Conceptual questions.
- Numerical calculations.
- Business scenarios.
- Spreadsheet interpretation.
- Chart interpretation.

Ensure balanced syllabus coverage.

==================================================
VALIDATION CHECKLIST
==================================================

Before returning the response, verify internally that:

✓ Exactly ${numQuestions || 10} questions have been generated.

✓ IDs run sequentially from 1 to ${numQuestions || 10}.

✓ JSON is valid.

✓ Every object contains all required fields.

✓ Every MCQ contains exactly four options.

✓ Input questions contain an empty options array.

✓ Excel questions include spreadsheet content.

✓ Excel questions include a chart.

✓ Charts require interpretation.

✓ Correct answers are always arrays.

✓ No duplicate questions exist.

✓ No duplicated wording exists.

✓ The required distribution is met:

- Multiple Choice Questions (50%)
- Input Questions (30%)
- Excel Questions (20%)

✓ Only these type values are used:

- MCQ
- Input
- Excel

==================================================
FINAL INSTRUCTIONS
==================================================

Do not think aloud.

Do not explain your reasoning.

Do not include markdown.

Do not include notes.

Do not include headings in the output.

Do not include any text before the JSON.

Do not include any text after the JSON.

Return ONLY one valid JSON array.

If any validation fails, regenerate internally until every requirement is satisfied before producing the final response.
    `;

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
            systemInstruction: `You are an experienced ACCA Foundation examiner responsible for writing examination-standard practice questions.
            Use ONLY the uploaded ${subject} Study Text and Exam Kit as your source material and topic must be ${topic}.
            Create completely original questions that assess the same learning outcomes without copying wording from the source material.
            Do not reproduce or paraphrase copyrighted content. Create new, original questions that test the same concepts and learning outcomes.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER, description: "Sequential question index starting from 1" },
                  question: { type: Type.STRING, description: "The ACCA exam question text, scenarios, or calculations" },
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
                  type: { type: Type.STRING, description: "The category of the question (e.g. single)" }
                },
                required: ["id", "question", "options", "correct_answer", "explanation", "type"]
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
