import React, { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { DetailedVideoAnalysis } from '../../types';
import { extractVideoIdFromUrl, getVideoDetails, getAllVideoComments } from '../../services/youtubeService';
import { analyzeAudienceInsight } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { VideoListResultCard } from './VideoListResultCard';

interface VideoListAnalysisTabProps {
    youtubeApiKeys: string[];
    currentYoutubeKeyIndex: number;
    setCurrentYoutubeKeyIndex: Dispatch<SetStateAction<number>>;
    keysReady: boolean;
}

export const VideoListAnalysisTab: React.FC<VideoListAnalysisTabProps> = ({ 
    youtubeApiKeys, 
    currentYoutubeKeyIndex, 
    setCurrentYoutubeKeyIndex, 
    keysReady 
}) => {
    const [videoUrlsInput, setVideoUrlsInput] = useState('');
    const [results, setResults] = useState<DetailedVideoAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');

    const updateResult = (id: string, updates: Partial<DetailedVideoAnalysis>) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const handleAnalyze = useCallback(async () => {
        if (!keysReady) {
            setGlobalError("Chưa sẵn sàng để phân tích. Vui lòng đợi API keys được tải.");
            return;
        }

        setIsLoading(true);
        setGlobalError(null);
        setResults([]);
        setProgressMessage('');

        const urls = videoUrlsInput.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) {
            setGlobalError('Vui lòng nhập ít nhất một URL video YouTube.');
            setIsLoading(false);
            return;
        }

        const initialResults: DetailedVideoAnalysis[] = urls.map((url, index) => {
            const id = extractVideoIdFromUrl(url) || `invalid-url-${index}`;
            return {
                id,
                title: url,
                description: '',
                tags: [],
                thumbnailUrl: '',
                allComments: [],
                audienceInsight: '',
                status: id.startsWith('invalid') ? 'error' : 'loading',
                error: id.startsWith('invalid') ? 'URL không hợp lệ' : undefined,
                commentCount: null
            };
        });
        setResults(initialResults);

        for (const result of initialResults) {
            if (result.status === 'error') continue;

            const videoId = result.id;
            setProgressMessage(`Đang xử lý video: ${videoId}...`);
            let success = false;
            let lastError: Error | null = null;
            
            const keyIndexesToTry = Array.from(
                { length: youtubeApiKeys.length },
                (_, i) => (currentYoutubeKeyIndex + i) % youtubeApiKeys.length
            );

            for (const keyIndex of keyIndexesToTry) {
                const currentApiKey = youtubeApiKeys[keyIndex];
                setCurrentYoutubeKeyIndex(keyIndex);
                
                try {
                    // Fetch details and comments
                    setProgressMessage(`[${videoId}] Đang tải thông tin và bình luận...`);
                    const details = await getVideoDetails(videoId, currentApiKey);
                    updateResult(videoId, { title: details.title, commentCount: details.commentCount });
                    
                    const comments = await getAllVideoComments(videoId, currentApiKey);

                    // Analyze with Gemini
                    setProgressMessage(`[${details.title}] AI đang phân tích insight...`);
                    const insight = await analyzeAudienceInsight(comments, details.title);

                    updateResult(videoId, {
                        ...details,
                        allComments: comments,
                        audienceInsight: insight,
                        status: 'completed'
                    });

                    success = true;
                    lastError = null;
                    break; // Success, move to next video

                } catch (err: any) {
                    lastError = err;
                    const errorMessage = err.message || '';
                    if (errorMessage.includes('quotaExceeded') || errorMessage.includes('dailyLimitExceeded')) {
                        console.warn(`API key at index ${keyIndex} exhausted. Trying next key.`);
                        continue; // Quota error, try next key
                    } else {
                        updateResult(videoId, { status: 'error', error: errorMessage });
                        break; // Different error, stop trying for this video
                    }
                }
            }
             if (!success && lastError) {
                const finalErrorMessage = (lastError.message || '').includes('quota')
                    ? "Tất cả YouTube API keys đã hết hạn ngạch."
                    : `Lỗi: ${lastError.message}`;
                updateResult(videoId, { status: 'error', error: finalErrorMessage });
            }
        }
        setProgressMessage('Hoàn tất phân tích!');
        setIsLoading(false);

    }, [videoUrlsInput, keysReady, youtubeApiKeys, currentYoutubeKeyIndex, setCurrentYoutubeKeyIndex]);
    
    return (
        <div className="space-y-8">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Phân Tích Video Chi Tiết</h2>
                <p className="text-gray-400 mb-4">Dán danh sách các link video YouTube (mỗi link một dòng) để lấy thông tin, toàn bộ bình luận và nhận phân tích insight khán giả từ AI.</p>
                <textarea
                    rows={8}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
                    placeholder="Vd: https://www.youtube.com/watch?v=xxxxxxxxxxx"
                    value={videoUrlsInput}
                    onChange={(e) => setVideoUrlsInput(e.target.value)}
                    disabled={isLoading}
                />
                 <div className="mt-6 text-center">
                     <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !keysReady}
                        title={!keysReady ? 'Vui lòng đợi API keys được tải hoặc khắc phục lỗi' : ''}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Bắt đầu Phân Tích'}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg text-indigo-400">{progressMessage || 'Đang khởi động...'}</p>
                </div>
            )}

            {globalError && (
                <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                    <p>{globalError}</p>
                </div>
            )}

            {results.length > 0 && (
                 <div className="mt-8">
                    <h2 className="text-3xl font-bold text-center mb-8 text-gray-200">
                        Kết Quả Phân Tích
                    </h2>
                    <div className="space-y-6">
                        {results.map((result) => (
                            <VideoListResultCard key={result.id} result={result} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
