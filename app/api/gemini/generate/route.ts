import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Quiz, AuditLog } from "@/lib/models";
import { getAuthUser } from "@/lib/jwt";
import fs from 'fs';
import path from 'path';
import { PDFParse } from "pdf-parse";

const extractedBooks = async (matchingFiles: string[], booksDirectory: string) => {
  const uploadedPromises = matchingFiles.map(async (fileName) => {
    const filePath = path.join(booksDirectory, fileName);
    const dataBuffer = await fs.promises.readFile(filePath);
    const uint8Array = new Uint8Array(dataBuffer);
    const pdfParser = new PDFParse(uint8Array);
    const pdfData = await pdfParser.getText();
    return {
      fileName,
      content: pdfData.text,
    };
  });

  const uploadedBooks = await Promise.all(uploadedPromises);
  return uploadedBooks;
}

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

    const booksdata = await extractedBooks(matchingFiles, booksDirectory);

    const formattedBooksContext = booksdata
      .map((book, index) => {
        return `--- BOOK ${index + 1}: ${book.fileName} ---\n${book.content}\n--- END OF ${book.fileName} ---`;
      })
      .join('\n\n');

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

    const prompt = `
==================================================
SOURCE MATERIAL
==================================================

${formattedBooksContext}

- Use the given source material only as a knowledge reference.
- Cover the syllabus for ${topic} naturally and proportionally.
- Never copy wording from the source material.
- Never reference page numbers or mention the given source material.

==================================================
SYSTEM ROLE
==================================================

You are an experienced ACCA Foundation examiner responsible for writing examination-standard practice questions.

Use ONLY the given ${subject} Study Text and Exam Kit as your source material. The topic must be ${topic}.

Create completely original questions that assess the same learning outcomes without copying wording from the source material. Do not reproduce or paraphrase copyrighted content.

==================================================
OBJECTIVE
==================================================

- Generate exactly ${numQuestions || 10} JSON objects.
- Never generate fewer or more.
- Return ONLY valid JSON — a single JSON array, nothing else.
- No introductions, explanations, notes, markdown fences, or text before/after the JSON.

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
DIFFICULTY CALIBRATION (STRICTLY ENFORCED)
==================================================

Every generated question MUST strictly follow ALL requirements of the selected difficulty.

Difficulty affects FOUR independent dimensions:

1. English Vocabulary
2. Question Length
3. Concept Integration
4. Reasoning Complexity

The AI MUST satisfy ALL four dimensions simultaneously.

Never mix difficulty levels.

==================================================
ENGLISH VOCABULARY
==================================================

Vocabulary MUST become progressively more advanced.

Easy
- Use very simple English.
- Everyday vocabulary.
- Short sentences.
- Avoid complex grammar.
- Suitable for beginners.

Medium
- Use moderately advanced vocabulary.
- Include some accounting terminology naturally.
- Slightly longer sentences.
- Reading difficulty should noticeably increase.

Hard
- Use professional business English.
- Use formal accounting and financial terminology.
- Vocabulary should be similar to IELTS Band 7.5–8.5.
- Include more complex sentence structures.

Extreme
- Use highly professional examination-standard English.
- Vocabulary should resemble ACCA professional papers.
- Reading difficulty comparable to IELTS Band 8.5–9.
- Long, information-dense sentences.
- Candidates should need strong comprehension before solving.

==================================================
QUESTION LENGTH
==================================================

Question length MUST strictly match the selected difficulty.

Easy
- Approximately 4–5 lines.
- Single short scenario.

Medium
- Approximately 10–15 lines.
- Slightly detailed scenario.

Hard
- MUST contain 2–4 detailed paragraphs.
- Every paragraph should contain approximately 90–140 words.
- Every question MUST present a highly detailed business case.
- Include multiple people, departments, transactions or business events where appropriate.
- Never generate short questions at Hard level.
- Never compress information into fewer paragraphs.

Extreme
- MUST contain 5–7 detailed paragraphs.
- Every paragraph should contain approximately 90–140 words.
- Every question MUST present a highly detailed business case.
- Include multiple stakeholders, departments, timelines, assumptions, financial information and business events.
- Never generate short questions at Extreme level.
- Never compress information into fewer paragraphs.

==================================================
CONCEPT INTEGRATION
==================================================

All concepts MUST belong ONLY to the selected topic.

Never introduce concepts outside the requested topic.

Never introduce prerequisite concepts that belong to another syllabus topic unless they are absolutely essential for understanding the selected topic.

Easy
- Test exactly ONE concept.

Medium
- Link 2–3 concepts from the SAME topic.

Hard
- Integrate 4–8 concepts from the SAME topic.
- Include 1-3 realistic adjustments.
- Require connecting multiple ideas before solving.

Extreme
- Integrate 10–15 concepts from the SAME topic.
- Include 5-7 realistic adjustments.
- Require candidates to distinguish relevant from irrelevant information.
- Multiple calculations and interpretations may be needed.
- Every concept MUST still belong ONLY to the selected topic.

==================================================
REASONING COMPLEXITY
==================================================

Easy
- One-step recall OR one-step calculation.
- Direct application.
- No interpretation.

Medium
- Two to three reasoning steps.
- Link two or three concepts.
- Small adjustment may be required.

Hard
- Five or more reasoning steps.
- Multiple linked calculations.
- Professional judgement.
- Several adjustments.
- Interpretation required.
- Candidate must analyse the scenario before deciding how to solve it.
- The correct approach should not always be immediately obvious.
- Test conceptual understanding more than calculation speed.
- Encourage logical reasoning and professional judgement.
- The business scenario must appear before the actual question.
- The final question should normally occupy only the last one or two sentences.

Extreme
- Ten or more reasoning steps.
- Multiple linked calculations.
- Numerous adjustments.
- Professional judgement throughout.
- Identify relevant information.
- Ignore misleading information.
- Choose the correct accounting treatment before solving.
- Similar complexity to the hardest ACCA examination questions.
- The candidate must first identify the underlying business issue before selecting an accounting treatment.
- Several solution paths may appear possible, but only one should be conceptually correct.
- Require evaluation, interpretation, elimination, and professional judgement before calculations begin.
- Assess deep conceptual understanding rather than memorisation.
- The answer should only be achievable through careful analysis of the entire scenario.
- The candidate should not immediately recognise which accounting treatment applies.
- The scenario should require interpretation before selecting the appropriate concept.

==================================================
COGNITIVE & ANALYTICAL ASSESSMENT
==================================================

The primary objective of every question is to assess the candidate's conceptual understanding, analytical thinking, professional judgement, and problem-solving ability — not simple memorisation.

Every question should require the candidate to actively think before arriving at the answer.

Whenever appropriate for the selected difficulty, require the candidate to:

- Analyse the business scenario before identifying the relevant concept(s).
- Interpret financial or business information rather than simply recalling facts.
- Distinguish relevant information from irrelevant or misleading information.
- Decide which accounting principle, method, or treatment is appropriate before performing any calculation.
- Apply concepts to unfamiliar situations instead of repeating textbook examples.
- Connect multiple pieces of information logically.
- Demonstrate professional judgement where more than one approach appears possible.
- Identify assumptions that affect the final answer.
- Evaluate alternative treatments before selecting the most appropriate one.
- Avoid relying solely on memorised formulas or definitions.
- The candidate should first think "What is happening in this scenario?" before thinking "Which formula should I use?"
- Questions should assess whether candidates can identify the correct accounting treatment or business principle before attempting any calculations.
- Do not reward memorisation alone.
- Reward understanding, interpretation, analysis, evaluation and judgement.

Questions should test HOW the student thinks, analyses, interprets, and applies knowledge—not merely WHAT the student remembers.

The candidate should need to understand the underlying concepts before solving the question.

Never generate "plug-the-formula" questions where the candidate can immediately substitute values into a formula without first analysing the scenario.

Questions should reward conceptual understanding, logical reasoning, and professional judgement rather than memorisation.

==================================================
STRICT VALIDATION
==================================================

Before finalising each question, silently verify:

✓ English vocabulary matches the selected difficulty.
✓ Question length matches the selected difficulty.
✓ Number of linked concepts matches the selected difficulty.
✓ ALL concepts belong ONLY to ${topic}.
✓ Reasoning complexity matches the selected difficulty.

If ANY requirement fails, regenerate the question internally before returning the JSON.

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
✓ English vocabulary strictly matches ${difficulty}.
✓ Question length strictly matches ${difficulty}.
✓ Required number of concepts are linked according to ${difficulty}.
✓ Every linked concept belongs ONLY to ${topic}; no out-of-topic concepts.
✓ Every question assesses conceptual understanding, not rote memorisation.
✓ Every question requires analytical thinking appropriate to the selected difficulty.
✓ The candidate must actively interpret or analyse information before solving.
✓ Questions test application of concepts rather than simple recall whenever appropriate.
✓ Business scenarios require reasoning, judgement, and decision-making instead of direct formula substitution.

If any check fails, regenerate internally before producing final output.

==================================================
HARD ENFORCEMENT RULE
==================================================

The four difficulty dimensions are mandatory.

Do NOT simplify the language.
Do NOT shorten the scenario.
Do NOT reduce the number of linked concepts.
Do NOT introduce concepts outside ${topic}.

If the generated question violates ANY requirement, regenerate it internally until every requirement is satisfied.

==================================================
FINAL INSTRUCTIONS
==================================================

Do not think aloud. Do not explain your reasoning. Do not include markdown fences around the JSON array itself, headings, notes, or any text before/after the JSON. Return ONLY the JSON array.
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
            ]
          }],
          config: {
            temperature: 0.2,
            systemInstruction: `You are an experienced ACCA Foundation examiner creating original, exam-standard practice questions for ${topic} in ${subject}.
            - Generate EXACTLY ${numQuestions} JSON objects in a single JSON array.
            - Output MUST be valid JSON only — no introductions, markdown code blocks around the JSON array, notes, or post-text.
            - Do not copy wording, reference page numbers, or mention given source material.`,
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
