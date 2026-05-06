const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const geminiSchema = {
    type: "object",
    properties: {
        matchScore: {
            type: "number",
            description: "Score from 0-100 indicating resume-job alignment"
        },
        technicalQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        behavioralQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: ["question", "intention", "answer"]
            }
        },
        skillGaps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    skill: { type: "string" },
                    severity: {
                        type: "string",
                        enum: ["low", "medium", "high"]
                    }
                },
                required: ["skill", "severity"]
            }
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
                        items: { type: "string" }
                    }
                },
                required: ["day", "focus", "tasks"]
            }
        },
        title: {
            type: "string",
            description: "The title of the job for which the interview report is generated"
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "title"]
};

const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string(),
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string()),
    })),
    title: z.string().describe("The title of the job for which the interview report is generated"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
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

module.exports = { generateInterviewReport };