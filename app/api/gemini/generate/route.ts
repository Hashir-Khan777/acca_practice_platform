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
OBJECTIVE
==================================================

- Generate exactly ${numQuestions || 10} JSON objects.
- Never generate fewer or more.
- Return ONLY valid JSON — a single JSON array, nothing else.
- No introductions, explanations, notes, markdown fences, or text before/after the JSON.

==================================================
SOURCE MATERIAL
==================================================

- Use the uploaded material only as a knowledge reference.
- Cover the syllabus for ${topic} naturally and proportionally.
- Never copy wording from the source material.
- Never reference page numbers or mention the uploaded files.

==================================================
CRITICAL RULE — NO ANSWER LEAKAGE
==================================================

This is a hard requirement. Violating it invalidates the question.

- The "question" field must NEVER contain the correct answer, a strong hint toward it, or any wording that reveals it (e.g. do not write "...which results in a profit of $500, what is the margin?" if $500 is itself derivable only from the answer).
- For Excel questions, the embedded spreadsheet/table/chart data must be usable to REACH the answer through calculation or interpretation — it must never already display the final answer value being asked for.
- Do not label any value in a spreadsheet or chart as "Answer", "Correct", "Result", or similar.
- Do not include worked solutions, calculation steps, or reasoning inside the "question" field — that belongs only in "explanation".
- Before finalizing each question, re-read the "question" field alone (without "correct_answer") and confirm a candidate could not simply read off the answer without doing the task.

==================================================
DIFFICULTY CALIBRATION (based on ${difficulty})
==================================================

Derive the actual difficulty of each question from how the uploaded Exam Kit questions of the corresponding difficulty are constructed — do not default to a generic style. Use this rubric strictly:

**Easy**
- Single-step recall or a one-step calculation.
- Tests a definition, classification, or direct application of one formula.
- No multi-stage reasoning required.

**Medium**
- Two-to-three step calculation, or requires linking two concepts together.
- May require adjusting for one complicating factor (e.g. accruals, discounts, one variance).
- Some interpretation of data required, but the path to the answer is fairly direct.

**Hard**
- Multi-step calculation (5+ stages) or requires synthesising multiple concepts.
- Requires judgement, interpretation of ambiguous/conflicting data, or identifying which of several methods applies.
- May include a distractor path that looks plausible but is wrong.

**Extreme**
- Multi-step calculation (10+ stages) combining several concepts from different syllabus areas in a single scenario.
- Requires the candidate to first identify which method/approach applies before any calculation can begin — the correct approach is not obvious from the question framing.
- Includes at least one deliberately misleading or irrelevant piece of data that a competent candidate must recognise and discard.
- Distractors (for MCQ) must reflect a highly plausible but subtly flawed line of reasoning, not just an arithmetic slip.
- Reserved for candidates operating at the top end of qualification level — treat this as exam "stretch" questions, not routine practice.
 
Apply ONLY the rubric tier matching ${difficulty} to every question generated. Do not mix tiers within one batch unless ${difficulty} explicitly requests "mixed".

==================================================
QUESTION FORMATS
==================================================

**Multiple Choice Questions (MCQ)**
- Exactly four options.
- One or more may be correct.
- Distractors must be realistic (common calculation errors, plausible misconceptions) — not obviously wrong.

**Input Questions**
- No answer options (empty array).
- Candidate calculates and provides a final numeric answer.

**Excel Questions**
- Include a realistic spreadsheet as a GFM markdown table.
- Include a text-based chart (ASCII, e.g. using '#' or '█') inside a fenced code block.
- The chart must contain data that requires interpretation, not a direct lookup.
- The candidate must analyse both the table and the chart to answer — never a question answerable by reading one cell directly.

Only use these exact values for "type": 'MCQ', 'Input', 'Excel'. No other values.

==================================================
MARKDOWN FORMATTING RULES (react-markdown + remark-gfm COMPATIBLE)
==================================================

These rules are mandatory because output is rendered with react-markdown and remark-gfm. Non-compliant markdown will break rendering.
 
1. Tables - use standard GFM pipe-table syntax with a header separator row, for example a row of column headers, then a row of dashes as the separator, then data rows. Keep to a maximum of 4 columns and 4 data rows.
 
2. Charts - wrap ASCII charts in a fenced code block (three backtick characters on their own line before and after the chart) so remark-gfm renders them as a code block and does not try to parse the characters as markdown.
 
3. Line breaks - inside the JSON string, use the two-character escape sequence backslash-n for every line break (never a raw unescaped newline). Use two of these in a row to separate paragraph, table, and chart blocks so remark-gfm renders them as distinct blocks.
 
4. Escaping - every double-quote character and backslash character used as literal text must be properly JSON-escaped. Pipe characters used as literal text (not as a table delimiter) must not break the table structure. Do not use HTML tags. Do not nest a fenced code block inside another fenced code block.
 
5. No stray markdown - do not use bold, italics, or heading markers inside "question" fields outside of the Excel chart code block; keep formatting plain except for the table and chart in Excel questions.

==================================================
EXPLANATION REQUIREMENTS
==================================================

- 1 to 3 sentences only.
- Explain why the correct answer is correct.
- Concise and accurate. No restating the full question.

==================================================
OUTPUT SCHEMA
==================================================

Return ONLY one valid JSON array, each object exactly matching:

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

Field rules:
- "id": starts at 1, sequential, no gaps, ends at ${numQuestions || 10}.
- "question": always present; must pass the "no answer leakage" check above.
- "options": MCQ → exactly four items. Input → empty array. Excel → empty array unless discrete answer choices are genuinely required.
- "correct_answer": always an array, never a string, never null.
- "explanation": always present.
- "type": one of 'MCQ', 'Input', 'Excel' only.

==================================================
QUESTION DISTRIBUTION — EXACT COUNTS (NOT PERCENTAGES)
==================================================

Percentages are unreliable for small batches, so compute exact integer counts before generating anything:

1. Let N = ${numQuestions || 10}.
2. mcqCount = round(N × 0.5)
3. inputCount = round(N × 0.3)
4. excelCount = N − mcqCount − inputCount   (this absorbs any rounding remainder — never let excelCount go negative; if it would, reduce mcqCount by 1 first)

Worked example for N = 10: mcqCount = 5, inputCount = 3, excelCount = 2.
Worked example for N = 7: mcqCount = 4 (round(3.5)), inputCount = 2 (round(2.1)), excelCount = 1.

Generate EXACTLY mcqCount MCQs, EXACTLY inputCount Input questions, and EXACTLY excelCount Excel questions — total must equal N. Interleave the types throughout the array in a natural order; do not group all of one type together (e.g. avoid all MCQs first).

==================================================
SYLLABUS & CONTENT BALANCE
==================================================

Across all ${numQuestions || 10} questions, ensure a mix of:
- Theory / conceptual questions
- Numerical calculations
- Realistic business scenarios
- Spreadsheet interpretation (within Excel questions)
- Chart interpretation (within Excel questions)

Distribute across different syllabus areas of ${topic} — do not cluster all questions on one sub-topic.

==================================================
INTERNAL VALIDATION CHECKLIST (do not output this)
==================================================

Before returning the response, silently verify:
✓ Exactly N questions generated, IDs sequential 1→N.
✓ JSON is valid and is the ONLY output.
✓ Every object has all five required fields.
✓ Every MCQ has exactly four options; every Input has an empty options array.
✓ No "question" field reveals or hints at its own "correct_answer".
✓ Every Excel question has a GFM table AND a fenced-code-block ASCII chart requiring interpretation.
✓ correct_answer is always an array.
✓ No duplicate questions or near-duplicate wording.
✓ Counts exactly match mcqCount / inputCount / excelCount computed above.
✓ Difficulty of every question matches the ${difficulty} rubric tier.
✓ Only type values used: MCQ, Input, Excel.

If any check fails, regenerate internally before producing final output.

==================================================
FINAL INSTRUCTIONS
==================================================

Do not think aloud. Do not explain your reasoning. Do not include markdown fences around the JSON array itself, headings, notes, or any text before/after the JSON. Return ONLY the JSON array.
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
            temperature: 0.2,
            systemInstruction: `You are an experienced ACCA Foundation examiner responsible for writing examination-standard practice questions.
              Use ONLY the uploaded ${subject} Study Text and Exam Kit as your source material. The topic must be ${topic}.
              Create completely original questions that assess the same learning outcomes without copying wording from the source material. Do not reproduce or paraphrase copyrighted content.`,
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
