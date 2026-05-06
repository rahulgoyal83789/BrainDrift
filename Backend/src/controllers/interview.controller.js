const pdfParse = require("pdf-parse");
const { generateInterviewReport , generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
/**
 * @description Generate interview report based on resume, self description and job description
 */
async function generateInterviewReportController(req, res) {
    
    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
    const { selfDescription, jobDescription } = req.body;

    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
    });

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interviewReportByAi,
    });

    res.status(201).json({
        message: "Interview report generated successfully",
        interviewReport,
    });
};

/**
 * @description Get interview report by interviewId
 */
async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewId,
        user: req.user.id,
    });
    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found",
        });
    }
    res.status(200).json({
        message: "Interview report fetched successfully",
        interviewReport,
    });
}

/**
 * @description Get all interview reports of the logged in user
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({
        user: req.user.id,
    }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
    res.status(200).json({
        message: "Interview reports fetched successfully",
        interviewReports,
    });
}

/**
 * @description controller to generate resume pdf based on user self description , resume and job description
 */
async function generateResumePdfController(req, res) {
    const {interviewReportId} = req.params;
    const interviewReport = await interviewReportModel.findById(interviewReportId);
    if(!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found",
        });
    }
    const { resume, selfDescription, jobDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({resume, selfDescription, jobDescription});
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=resume_${interviewReportId}.pdf`,
    });
    res.send(pdfBuffer);
}

module.exports = { generateInterviewReportController , getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController};