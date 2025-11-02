import { GoogleGenAI } from "@google/genai";

async function generateSummary(prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        return "Gemini API Key chưa được cung cấp.";
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Không thể tạo tóm tắt do lỗi API Gemini. Vui lòng kiểm tra lại API Key.";
    }
}

export const summarizeText = async (text: string, title: string, apiKey: string): Promise<string> => {
    if (!text) return "Không có nội dung để tóm tắt.";
    const prompt = `Dựa vào bản ghi (transcript) của video YouTube có tiêu đề "${title}", hãy tóm tắt những ý chính, thông điệp cốt lõi và các điểm nổi bật nhất. Tóm tắt trong khoảng 3-5 câu, tập trung vào nội dung chính mà video truyền tải:\n\n---\n${text.substring(0, 15000)}\n---`;
    return generateSummary(prompt, apiKey);
};

export const summarizeComments = async (comments: string[], apiKey: string): Promise<string> => {
    if (comments.length === 0) return "Không có bình luận nào để phân tích.";
    const commentsText = comments.slice(0, 50).join('\n'); // Use up to 50 comments
    const prompt = `Phân tích và tóm tắt các chủ đề chính, tình cảm chung (tích cực, tiêu cực, trung lập) và bất kỳ cuộc tranh luận nào nổi bật từ các bình luận YouTube sau. Nhận xét chung của khán giả là gì? Tóm tắt trong khoảng 3-4 câu:\n\n---\n${commentsText.substring(0, 8000)}\n---`;
    return generateSummary(prompt, apiKey);
};