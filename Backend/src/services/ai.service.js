const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const geminiSchema = {
  type: "object",
  properties: {
    matchScore: {
      type: "number",
      description: "Score from 0-100 indicating resume-job alignment",
    },
    technicalQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "number" },
          focus: { type: "string" },
          tasks: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["day", "focus", "tasks"],
      },
    },
    title: {
      type: "string",
      description:
        "The title of the job for which the interview report is generated",
    },
  },
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
};

const interviewReportSchema = z.object({
  matchScore: z.number().min(0).max(100),
  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),
  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
    }),
  ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `You are an expert interview preparation coach. Analyze the following and generate an interview report.

    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}

    Include:
    - A match score (0-100)
    - At least 5 technical questions with intention and answer guidance
    - At least 5 behavioral questions with intention and answer guidance
    - Skill gaps with severity (low/medium/high)
    - A preparation plan where YOU decide the number of days based on how long it would 
      realistically take an average person to fully prepare for this interview given their 
      current profile, skill gaps, and the job requirements. 
      Do not fix it to any number, estimate it honestly.
    - The job title extracted from the job description`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: geminiSchema,
    },
  });

  const reportData = JSON.parse(response.text);

  return interviewReportSchema.parse(reportData);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ 
    format: "A4", 
    margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    });
  await browser.close();
  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        " The HTML content of the resume which can be converted to a pdf using a library like puppeteer. The HTML should be well-structured and styled to look like a professional resume.",
      ),
  });

  const prompt = `You are an expert resume writer. Based on the following information, generate a well-structured and professionally styled HTML resume that can be converted to PDF.

    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}
    The response should be a json object with a single field "html" containing the HTML content of the resume. The HTML should be well-structured and styled to look like a professional resume.
    The HTML should include sections like Contact Information, Summary, Work Experience, Education, Skills, and any other relevant sections based on the provided information. Ensure the design is clean and suitable for a professional job application.
    The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
    The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
    you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
    The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
    The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });
  const jsonContent = JSON.parse(response.text);
  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);
  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };