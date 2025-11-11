import { GoogleGenAI, Type } from "@google/genai";
import type { OutlineData, FinalScript, ScriptLength, AidaPuzzleSection, TitleTrendAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Video/Comment Summarization ---

async function generateSummary(prompt: string): Promise<string> {
    try {
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

export const summarizeText = async (text: string, title: string): Promise<string> => {
    if (!text) return "Không có nội dung để tóm tắt.";
    const prompt = `Dựa vào bản ghi (transcript) của video YouTube có tiêu đề "${title}", hãy tóm tắt những ý chính, thông điệp cốt lõi và các điểm nổi bật nhất. Tóm tắt trong khoảng 3-5 câu, tập trung vào nội dung chính mà video truyền tải:\n\n---\n${text.substring(0, 15000)}\n---`;
    return generateSummary(prompt);
};

export const summarizeComments = async (comments: string[]): Promise<string> => {
    if (comments.length === 0) return "Không có bình luận nào để phân tích.";
    const commentsText = comments.slice(0, 50).join('\n'); // Use up to 50 comments
    const prompt = `Phân tích và tóm tắt các chủ đề chính, tình cảm chung (tích cực, tiêu cực, trung lập) và bất kỳ cuộc tranh luận nào nổi bật từ các bình luận YouTube sau. Nhận xét chung của khán giả là gì? Tóm tắt trong khoảng 3-4 câu:\n\n---\n${commentsText.substring(0, 8000)}\n---`;
    return generateSummary(prompt);
};

// --- New function for Detailed Video Analysis ---
export const analyzeAudienceInsight = async (comments: string[], title: string): Promise<string> => {
    if (comments.length === 0 || (comments.length === 1 && (comments[0].includes("Bình luận đã bị tắt") || comments[0].includes("Không có bình luận")))) {
        return "Không có bình luận để phân tích.";
    }

    const commentsText = comments.slice(0, 300).join('\n'); // Limit to 300 comments to avoid huge prompts
    const prompt = `Bạn là một nhà phân tích kênh YouTube chuyên nghiệp. Dựa trên tiêu đề video và danh sách bình luận của người dùng, hãy cung cấp một bản phân tích sâu sắc về insight khán giả. Phân tích của bạn nên bao gồm:

1.  **Cảm xúc chung:** Tích cực, tiêu cực hay hỗn hợp? Những cảm xúc nào chiếm ưu thế?
2.  **Chủ đề chính:** Các chủ đề, câu hỏi và điểm thảo luận chính trong các bình luận là gì?
3.  **Phản hồi của khán giả:** Những đề xuất, phê bình hoặc lời khen cụ thể nào được đề cập?
4.  **Hồ sơ khán giả (Suy luận):** Bạn có thể suy ra điều gì về sở thích, trình độ kiến thức của khán giả và những gì họ muốn xem tiếp theo?

Trình bày dưới dạng một bản tóm tắt có cấu trúc, dễ đọc.

**Tiêu đề video:** "${title}"

**Bình luận:**
---
${commentsText.substring(0, 25000)} 
---`;
    
    return generateSummary(prompt);
};


// --- Title Trend Analysis ---
const titleTrendAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overview: {
            type: Type.STRING,
            description: "Một bản tóm tắt phân tích tổng quan, khoảng 3-5 câu, về các xu hướng chung, chủ đề, từ khóa, và cấu trúc tiêu đề nổi bật từ danh sách được cung cấp. Đánh giá tại sao chúng lại hấp dẫn khán giả."
        },
        trendingTitles: {
            type: Type.ARRAY,
            description: "Một danh sách gồm 5-7 tiêu đề tiêu biểu nhất, thể hiện rõ nhất các xu hướng đã được phân tích. Lấy trực tiếp từ danh sách tiêu đề đã cung cấp.",
            items: { type: Type.STRING }
        }
    },
    required: ["overview", "trendingTitles"]
};

export const analyzeTitleTrends = async (titles: string[]): Promise<TitleTrendAnalysis> => {
    if (titles.length === 0) {
        return { overview: "Không có tiêu đề nào để phân tích.", trendingTitles: [] };
    }

    const titlesString = titles.join('\n');
    const prompt = `
        Dựa vào danh sách các tiêu đề video YouTube có hiệu suất cao sau đây, hãy thực hiện phân tích chuyên sâu để tìm ra các xu hướng nổi bật.

        Danh sách tiêu đề:
        ---
        ${titlesString}
        ---

        Nhiệm vụ của bạn:
        1.  **Phân tích tổng quan**: Viết một đoạn đánh giá chung (overview) về các chủ đề, từ khóa, và cấu trúc tiêu đề đang thịnh hành. Giải thích ngắn gọn tại sao những yếu tố này lại thu hút được nhiều lượt xem. Ví dụ: "Các tiêu đề thường sử dụng con số cụ thể, mang tính tò mò cao và đề cập đến các chủ đề về công nghệ mới...".
        2.  **Liệt kê tiêu đề trending**: Chọn ra 5-7 tiêu đề (trendingTitles) từ danh sách trên mà bạn cho là tiêu biểu nhất cho các xu hướng đã phân tích.

        Hãy trả về kết quả dưới dạng JSON theo schema đã cung cấp.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: titleTrendAnalysisSchema,
                temperature: 0.5,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as TitleTrendAnalysis;
    } catch (error) {
        console.error("Error analyzing title trends:", error);
        throw new Error("Không thể phân tích xu hướng tiêu đề. Vui lòng thử lại.");
    }
};


// --- AI Script Writer ---

const singleOutlineSchema = {
  type: Type.OBJECT,
  properties: {
    suggestionTitle: {
        type: Type.STRING,
        description: "Một tiêu đề ngắn gọn, hấp dẫn cho phương án dàn ý này (ví dụ: 'Góc nhìn Lịch sử', 'Tập trung vào Tương lai', 'Câu chuyện Cá nhân')."
    },
    keyPoints: {
      type: Type.ARRAY,
      description: "Các điểm chính, cốt lõi của ý tưởng theo góc nhìn của dàn ý này.",
      items: { type: Type.STRING },
    },
    viralPoints: {
      type: Type.ARRAY,
      description: "Các yếu tố có khả năng lan truyền, gây chú ý mạnh trên mạng xã hội cho dàn ý này.",
      items: { type: Type.STRING },
    },
    aidaOutline: {
      type: Type.ARRAY,
      description: "Dàn ý chi tiết theo phương pháp 'Chuỗi AIDA giải đố'. Đây là một chuỗi các phần nhỏ, mỗi phần đặt ra một câu hỏi và giải đáp nó để dẫn dắt khán giả.",
      items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "Tiêu đề cho phần này, tóm tắt nội dung chính (ví dụ: 'Bí ẩn đầu tiên: Lỗ đen là gì?')."
            },
            question: {
                type: Type.STRING,
                description: "Câu hỏi gợi mở, mang tính 'giải đố' để bắt đầu phần này."
            },
            points: {
                type: Type.ARRAY,
                description: "Các ý chính cần triển khai để trả lời cho câu hỏi trên.",
                items: { type: Type.STRING }
            },
            estimatedWordCount: {
                type: Type.NUMBER,
                description: "Số từ ước tính cho phần này để đảm bảo tổng độ dài kịch bản đạt yêu cầu."
            }
        },
        required: ["title", "question", "points", "estimatedWordCount"]
      }
    },
  },
  required: ["suggestionTitle", "keyPoints", "viralPoints", "aidaOutline"],
};


const outlineSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "Một danh sách gồm 5 phương án dàn ý độc đáo và khác biệt nhau.",
            items: singleOutlineSchema
        }
    },
    required: ["suggestions"]
};

const finalScriptSchema = {
    type: Type.OBJECT,
    properties: {
        vietnameseScript: {
            type: Type.STRING,
            description: "Kịch bản hoàn chỉnh bằng tiếng Việt CHO PHẦN NÀY, chỉ bao gồm lời thoại cho text-to-speech, không có mô tả cảnh, hành động hay tên nhân vật."
        },
        englishScript: {
            type: Type.STRING,
            description: "Bản dịch tiếng Anh chất lượng cao của kịch bản tiếng Việt cho phần này."
        }
    },
    required: ["vietnameseScript", "englishScript"]
};

export const generateOutlineSuggestions = async (idea: string, length: ScriptLength): Promise<OutlineData[]> => {
  const prompt = `
    Phân tích ý tưởng kịch bản sau đây cho một video dài khoảng ${length} từ: "${idea}".

    Nhiệm vụ của bạn:
    Tạo ra 5 phương án dàn ý (outline suggestions) độc đáo và khác biệt cho ý tưởng này. Mỗi phương án phải tiếp cận chủ đề từ một góc nhìn riêng, sáng tạo.

    Với MỖI phương án trong 5 phương án, hãy:
    1.  Đặt một "suggestionTitle" - tiêu đề ngắn gọn, hấp dẫn cho phương án đó (ví dụ: "Góc nhìn Lịch sử", "Tập trung vào Yếu tố Con người", "Phân tích Tương lai").
    2.  Xác định các điểm thông tin cốt lõi (key points) phù hợp với góc nhìn đó.
    3.  Xác định các yếu tố có khả năng gây lan truyền (viral points) đặc thù cho phương án đó.
    4.  Xây dựng một dàn ý chi tiết theo phương pháp "Chuỗi AIDA giải đố".
        -   Chia nhỏ chủ đề thành nhiều phần logic nối tiếp nhau.
        -   Mỗi phần là một "AIDA nhỏ": Bắt đầu bằng TIÊU ĐỀ, CÂU HỎI khơi gợi, và các ĐIỂM CHÍNH để giải đáp.
        -   **QUAN TRỌNG**: Ước tính số từ (estimatedWordCount) cho mỗi phần. Tổng số từ của tất cả các phần phải xấp xỉ ${length} từ.
    
    Hãy trả về một danh sách chứa chính xác 5 phương án này dưới dạng JSON theo schema đã cung cấp.
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: outlineSuggestionsSchema,
            temperature: 0.8,
        }
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.suggestions as OutlineData[];
  } catch(error) {
    console.error("Error generating outline suggestions:", error);
    throw new Error("Không thể tạo các gợi ý dàn ý. Vui lòng thử lại.");
  }
};

export const generateScriptForSection = async (
    section: AidaPuzzleSection,
    idea: string,
    fullOutline: OutlineData,
    scriptContext: string
): Promise<FinalScript> => {
    const prompt = `
    Bạn là một người viết kịch bản chuyên nghiệp, chuyên tạo ra các video giải thích hấp dẫn.
    Ý tưởng gốc của video là: "${idea}".
    Toàn bộ dàn ý là: ${JSON.stringify(fullOutline, null, 2)}.
    
    Phần kịch bản đã viết trước đó:
    ---
    ${scriptContext || "Đây là phần đầu tiên của kịch bản."}
    ---

    Nhiệm vụ của bạn bây giờ là viết phần tiếp theo của kịch bản, dựa trên chi tiết của phần này:
    - Tiêu đề: "${section.title}"
    - Câu hỏi chính: "${section.question}"
    - Các điểm cần triển khai: ${section.points.join(', ')}
    - Số từ mục tiêu cho phần này: khoảng ${section.estimatedWordCount} từ.

    Yêu cầu:
    1.  **CỰC KỲ QUAN TRỌNG**: Kịch bản cho phần này PHẢI BẮT ĐẦU bằng chính xác câu hỏi gợi mở đã cho: "${section.question}". Sau khi đặt câu hỏi, hãy diễn giải và trả lời nó một cách lôi cuốn, sử dụng các điểm đã cho làm sườn ý chính để đảm bảo tính logic.
    2.  Viết nội dung bằng Tiếng Việt, đảm bảo chuyển tiếp mượt mà từ phần kịch bản trước đó.
    3.  Kịch bản phải được tối ưu hóa cho text-to-speech (tự nhiên, rõ ràng, ngắt nghỉ hợp lý).
    4.  Chỉ viết lời thoại hoặc lời dẫn chuyện cho PHẦN NÀY. Tuyệt đối KHÔNG bao gồm mô tả cảnh, hành động, tên nhân vật, hoặc ghi chú.
    5.  Sau khi hoàn thành phần Tiếng Việt, dịch chính xác nó sang Tiếng Anh.
    6. Tuân thủ kịch bản theo format AIDA giải đố. đảm bảo tính hấp dẫn bằng việc đưa câu hỏi và câu trả lời cho câu hỏi. 

    Hãy trả về kết quả dưới dạng JSON theo schema đã cung cấp.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: finalScriptSchema,
                temperature: 0.8,
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as FinalScript;
    } catch(error) {
        console.error("Error generating script for section:", error);
        throw new Error("Không thể tạo kịch bản cho phần này. Vui lòng thử lại.");
    }
}
