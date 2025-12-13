import { GoogleGenAI } from "@google/genai";
import { PayrollRecord } from "../types";

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is missing");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzePayroll = async (payrollData: PayrollRecord[], month: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "請先設定 API 金鑰以使用 AI 分析功能。";

    const prompt = `
    你是一個專業的教育機構財務顧問。請分析以下 ${month} 的薪資數據，並給出簡短的洞察與建議（約 200 字）。
    請關注：
    1. 哪位老師的課時最多或收入最高？
    2. 授課類型（一對一 vs 團體）的比例是否健康？
    3. 給予營運上的建議（例如是否該增加某類課程）。

    數據 JSON:
    ${JSON.stringify(payrollData, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "無法生成分析報告。";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI 分析服務暫時無法使用，請檢查 API 設定或稍後再試。";
    }
};
