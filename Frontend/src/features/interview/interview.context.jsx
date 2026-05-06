import { createContext, useState } from "react";

export const InterviewContext = createContext();
export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);
    return (
        <InterviewContext.Provider value={{ report, setReport, reports, setReports, loading, setLoading }}>
            {children}
        </InterviewContext.Provider>
    );
};