import { useContext, useEffect } from "react";
import {getAllInterviewReports,getInterviewReportById,generateInterviewReport} from "../services/interview.api";
import { InterviewContext } from "../interview.context";
import { useParams} from "react-router";

export const useInterview = () => {
    const context = useContext(InterviewContext);
    const {interviewId} = useParams();
    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }
    const { report, setReport, reports, setReports, loading, setLoading } = context;
    const generateReport = async ({jobDescription,selfDescription, resumeFile}) => {
        setLoading(true);
        let response = null;
        try {
            response = await generateInterviewReport({resumeFile,selfDescription,jobDescription});
            setReport(response.interviewReport);
        } catch (error) {
            console.error("Error generating interview report:", error);
        } finally {
            setLoading(false);
        }
        return response.interviewReport;
    };
    const getReportById = async (interviewId) => {
        setLoading(true);
        let response = null;
        try {
            response = await getInterviewReportById(interviewId);
            setReport(response.interviewReport);
        } catch (error) {
            console.error("Error fetching interview report:", error);
        } finally {
            setLoading(false);
        }
        return response.interviewReport;
    };
    const getReports = async () => {
        setLoading(true);
        let response = null;
        try {
            response = await getAllInterviewReports();
            setReports(response.interviewReports);
        } catch (error) {
            console.error("Error fetching interview reports:", error);
        } finally {
            setLoading(false);
        }
        return response.interviewReports;
    };

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        } else{
            getReports();
        }
    }, [interviewId]);

    return { loading, report, reports, generateReport, getReportById, getReports };
};