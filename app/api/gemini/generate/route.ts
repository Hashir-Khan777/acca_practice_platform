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
=======================================================
ENGLISH LANGUAGE DIFFICULTY (based on ${difficulty})
=======================================================

The language complexity must always match the selected difficulty.

This affects:
- vocabulary
- sentence structure
- scenario complexity
- amount of information
- level of interpretation required

Easy
------
- Use simple British English.
- Familiar accounting terminology.
- Minimal business context.
- One clear task.
- No unnecessary information.
- Candidate should understand the question after reading it once.

Medium
--------
- Use standard ACCA Foundation English.
- Include realistic business context.
- Introduce one or two accounting terms naturally.
- Candidate may need to read parts of the scenario twice.

Hard
------
- Use professional business English appropriate for ACCA Foundation.
- Use realistic business communication.
- Include reports, emails, management comments, extracts, or accounting records.
- Include relevant and irrelevant information.
- Candidate must identify which information matters.
- Interpretation should be required before any calculation.

Extreme
---------
- Use examination-quality professional English.
- Rich business scenarios with natural writing.
- Multiple paragraphs.
- Mix narrative, financial information, and supporting documents.
- Use professional accounting vocabulary without becoming overly technical.
- Candidate should need careful reading before identifying the correct approach.
- Difficulty should come from interpretation, judgement, and selecting relevant information—not confusing grammar or obscure vocabulary.

The language should never become artificially complicated.
Questions should be difficult because of accounting reasoning, not because of difficult English.

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

Ground the actual difficulty of each question in how the uploaded Exam Kit's questions of the corresponding difficulty are built — do not default to a generic style. Difficulty is controlled by FOUR levers used together, not step count alone: (1) number of linked steps, (2) scenario length, (3) how wrong answers are produced, (4) how many syllabus areas are touched. Varying step count alone while leaving scenario length and distractor quality constant will not read as meaningfully harder — apply all four levers at every tier.

**Easy** — scenario length approx. 15–35 words
- One-step recall or one-step calculation within ${topic}: one formula, one figure in, one figure out.
- Tests a definition, classification, or direct application of a single rule.
- Simple adjustment, normal interpretation, some irrelevant data.

**Medium** — scenario length approx. 40–70 words
- Two-to-three linked steps, or two concepts within ${topic} used together (e.g. accruals plus one adjustment).
- One complicating factor at most (a discount, an accrual, one variance).
- Some interpretation required, but the path to the answer is fairly direct.

**Hard** — scenario length approx. 80–130 words
- 5+ linked steps combining two or more concepts within ${topic} synthesised together.
- Requires judgement: the candidate must choose between two plausible approaches, or interpret data that isn't handed to them pre-sorted.
- Include one distractor path that looks plausible but is wrong.

**Extreme** — scenario length approx. 150–250 words
- 10+ linked steps combining all different syllabus areas within ${topic} in one scenario (e.g. a costing-method choice that feeds into a variance, or a depreciation-policy choice that feeds into a ratio). Only go beyond this if the uploaded Exam Kit's own hardest questions genuinely go further — do not invent complexity the source material doesn't support.
- The candidate must first work out which method or approach applies; this is not stated or implied by the question framing.
- Contains exactly one deliberately irrelevant or misleading figure that a competent candidate must notice and discard. It must be plausible enough to tempt a rushed candidate, not obviously junk.
- Every MCQ distractor is the numeric result of actually carrying out a specific, named plausible error (see the rule below) — never an arbitrary number placed near the correct answer.
- Must still be solvable by a well-prepared Foundation-level candidate inside normal exam time. This is the hardest question a strong candidate could realistically meet in this paper, not a professional-level problem — do not import complexity from outside the ${subject} Foundation syllabus.

**Distractor construction rule (mandatory for Hard and Extreme MCQs)**
Before writing a distractor, internally name the specific error it represents (e.g. "uses cost instead of net realisable value", "omits the part-year adjustment", "treats a variable cost as fixed"), then actually perform the calculation using that error to produce the distractor's number. Never invent a distractor number without deriving it this way. Do not include this internal reasoning in your output — only the final "options" and "correct_answer" arrays reflect it.

**Calibration example (guidance only — never output this block or refer to it)**
This uses depreciation purely to show the expected CONTRAST between tiers. Never reuse this topic, these numbers, or this wording in your actual output; ${topic} governs the real content.

  Easy shape: "A non-current asset cost $12,000 and has a 6-year useful life with no residual value. What is the annual straight-line depreciation charge?" — one formula, one figure in, one figure out, roughly 20 words.

  Extreme shape: a paragraph-length scenario where an asset is bought mid-year, its depreciation method changes partway through its life, it is part-exchanged for a new asset, and an unrelated insurance premium is mentioned as a distractor figure. The candidate must first decide which depreciation policy applies to which period before any figure can be calculated, and the insurance premium is never used in the correct answer. This is the LENGTH and STRUCTURE Extreme should have — build your actual Extreme question from ${topic}, not from depreciation, unless ${topic} literally is depreciation.

Apply ONLY the rubric tier matching ${difficulty} to every question generated. Do not mix tiers within one batch unless ${difficulty} explicitly requests "mixed".

==================================================
QUESTION FORMATS
==================================================

**Multiple Choice Questions (MCQ)**
- Exactly four options.
- Easy and Medium: exactly one correct option.
- Hard and Extreme: normally one correct option; occasionally two, per the DIFFICULTY CALIBRATION section above.
- Distractors must be realistic — apply the distractor construction rule above; mandatory for Hard and Extreme.

**Input Questions**
- No answer options (empty array).
- Candidate calculates and provides a final numeric answer.

**Excel Questions**
- Include a realistic spreadsheet as a GFM markdown table.
- Include a text-based chart (ASCII, e.g. using '#' or '█') inside a fenced code block.
- The chart must contain data that requires interpretation, not a direct lookup.
- The candidate must analyse both the table and the chart to answer — never a question answerable by reading one cell directly.
- Scale table/chart complexity to ${difficulty}:
  - Easy: one small table (max 3 rows), read directly; chart is context only.
  - Medium: table and chart together, one simple calculation links them.
  - Hard: a figure from the table or the chart must be recalculated before it can be used with the other.
  - Extreme: table and chart, plus one figure that must be derived — not given — before the main calculation can even start.

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
✓ Every Excel question has a GFM table AND a fenced-code-block ASCII chart requiring interpretation, scaled to ${difficulty} as specified above.
✓ correct_answer is always an array.
✓ No duplicate questions or near-duplicate wording.
✓ Counts exactly match mcqCount / inputCount / excelCount computed above.
✓ Difficulty of every question matches the ${difficulty} rubric tier, including its scenario-length band.
✓ Every Hard/Extreme MCQ distractor is traceable to a specific named error, not an arbitrary nearby number.
✓ Every Extreme question combines two syllabus areas within ${topic} and includes exactly one discardable irrelevant figure.
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
