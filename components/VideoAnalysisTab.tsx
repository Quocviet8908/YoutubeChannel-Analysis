import React, { useState, useCallback, useMemo, Dispatch, SetStateAction } from 'react';
import { ChannelInputForm } from './ChannelInputForm';
import { ResultsDisplay } from './ResultsDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { ResultsToolbar } from './ResultsToolbar';
import { convertIdentifierToChannelId, getChannelVideos, getVideoComments } from '../services/youtubeService';
import { summarizeComments, analyzeTitleTrends } from '../services/geminiService';
import { AnalyzedVideo, TitleTrendAnalysis } from '../types';
import { TitleTrendAnalysisDisplay } from './TitleTrendAnalysisDisplay';

interface VideoAnalysisTabProps {
    youtubeApiKeys: string[];
    currentYoutubeKeyIndex: number;
    setCurrentYoutubeKeyIndex: Dispatch<SetStateAction<number>>;
    keysReady: boolean;
    results: AnalyzedVideo[];
    setResults: Dispatch<SetStateAction<AnalyzedVideo[]>>;
}

const escapeCsvField = (field: any): string => {
    const stringField = String(field ?? '');
    if (/[",\n]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const VideoAnalysisTab: React.FC<VideoAnalysisTabProps> = ({ 
    youtubeApiKeys, 
    currentYoutubeKeyIndex, 
    setCurrentYoutubeKeyIndex, 
    keysReady,
    results: originalResults, 
    setResults: setOriginalResults 
}) => {
    const [channelsInput, setChannelsInput] = useState<string>(`https://www.youtube.com/@MrBeast
https://www.youtube.com/channel/UC295-Dw_tDNtZXFeAPAW6Aw
@mkbhd
https://www.youtube.com/@TheSleepyExplorer-r6o`);
    const [timeframe, setTimeframe] = useState<number>(30);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [sortOrder, setSortOrder] = useState<'ratio' | 'views'>('ratio');
    const [minViews, setMinViews] = useState<string>('');
    const [trendAnalysis, setTrendAnalysis] = useState<TitleTrendAnalysis | null>(null);
    
    const parseChannelInput = (input: string): string[] => {
        return input.split(/[\n,]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    const updateVideoSummary = (videoId: string, summary: string) => {
        setOriginalResults(prevResults => 
            prevResults.map(video => 
                video.id === videoId ? { ...video, videoSummary: summary } : video
            )
        );
    };

    const handleAnalyze = useCallback(async () => {
        if (!keysReady) {
            setError("Chưa sẵn sàng để phân tích. Vui lòng đợi API keys được tải.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setOriginalResults([]);
        setTrendAnalysis(null);

        const channelIdentifiers = parseChannelInput(channelsInput);
        
        if (channelIdentifiers.length === 0) {
            setError('Vui lòng nhập ít nhất một kênh YouTube hợp lệ (URL, ID hoặc @handle).');
            setIsLoading(false);
            return;
        }

        let lastError: Error | null = null;
        let success = false;
        
        const keyIndexesToTry = Array.from(
            { length: youtubeApiKeys.length },
            (_, i) => (currentYoutubeKeyIndex + i) % youtubeApiKeys.length
        );

        for (const keyIndex of keyIndexesToTry) {
            const currentApiKey = youtubeApiKeys[keyIndex];
            setCurrentYoutubeKeyIndex(keyIndex);

            try {
                const allTopVideos: AnalyzedVideo[] = [];
                const allTitlesForTrending: string[] = [];

                for (const identifier of channelIdentifiers) {
                    const channelInfo = await convertIdentifierToChannelId(identifier, currentApiKey);
                    if (!channelInfo) {
                        console.warn(`Không thể tìm thấy kênh cho: ${identifier}`);
                        continue;
                    }
                    
                    const videos = await getChannelVideos(channelInfo.channelId, timeframe, currentApiKey);
                    
                    if (videos.length === 0) continue;

                    // New logic for trend analysis: collect top 10 titles by views
                    const top10ByViews = [...videos]
                        .sort((a, b) => b.viewCount - a.viewCount)
                        .slice(0, 10);
                    top10ByViews.forEach(v => allTitlesForTrending.push(v.title));

                    const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
                    const averageViews = videos.length > 0 ? totalViews / videos.length : 0;

                    const potentialVideos = videos
                        .filter(video => video.viewCount > averageViews * 1.5)
                        .sort((a, b) => b.viewCount - a.viewCount);
                    
                    const top5Videos = potentialVideos.slice(0, 5);

                    for (const video of top5Videos) {
                        const comments = await getVideoComments(video.id, currentApiKey);
                        const commentsSummary = await summarizeComments(comments);
                        
                        allTopVideos.push({
                            ...video,
                            channelId: channelInfo.channelId,
                            channelName: channelInfo.channelName,
                            channelAverageViews: averageViews,
                            ratio: averageViews > 0 ? video.viewCount / averageViews : 0,
                            commentsSummary,
                        });
                    }
                }
                
                if (allTitlesForTrending.length > 0) {
                    try {
                        const trends = await analyzeTitleTrends(allTitlesForTrending);
                        setTrendAnalysis(trends);
                    } catch (trendError) {
                        console.error("Trend analysis failed:", trendError);
                        // Don't block the main results if trend analysis fails
                    }
                }

                setOriginalResults(allTopVideos);
                success = true;
                lastError = null;
                break; // Success, exit the loop

            } catch (err: any) {
                lastError = err;
                const errorMessage = err.message || '';
                if (errorMessage.includes('quotaExceeded') || errorMessage.includes('dailyLimitExceeded')) {
                    console.warn(`API key at index ${keyIndex} exhausted. Trying next key.`);
                    continue; // Quota error, try next key
                } else {
                    break; // Different error, stop trying
                }
            }
        }

        if (!success && lastError) {
            const finalErrorMessage = (lastError.message || '').includes('quota')
                ? "Tất cả YouTube API keys đã hết hạn ngạch. Vui lòng thử lại sau."
                : `Đã xảy ra lỗi: ${lastError.message}. Vui lòng kiểm tra lại.`;
            setError(finalErrorMessage);
        }

        setIsLoading(false);

    }, [channelsInput, timeframe, keysReady, youtubeApiKeys, currentYoutubeKeyIndex, setCurrentYoutubeKeyIndex, setOriginalResults]);

    const displayedResults = useMemo(() => {
        const viewFilter = Number(minViews) || 0;

        return originalResults
            .filter(video => video.viewCount >= viewFilter)
            .sort((a, b) => {
                if (sortOrder === 'ratio') {
                    return b.ratio - a.ratio;
                }
                return b.viewCount - a.viewCount;
            });
    }, [originalResults, sortOrder, minViews]);

    const handleExportToCsv = () => {
        if (displayedResults.length === 0) return;

        const headers = [
            'Hạng', 'Tiêu đề Video', 'URL Video', 'Tên Kênh', 'URL Kênh',
            'Lượt xem', 'Lượt xem TB Kênh', 'Tỷ lệ', 'Tóm tắt Bình luận', 'Tóm tắt Video'
        ];

        const data = displayedResults.map((video, index) => [
            index + 1,
            video.title,
            `https://www.youtube.com/watch?v=${video.id}`,
            video.channelName,
            `https://www.youtube.com/channel/${video.channelId}`,
            video.viewCount,
            Math.round(video.channelAverageViews),
            video.ratio.toFixed(2),
            video.commentsSummary,
            video.videoSummary || ''
        ]);

        const csvRows = [
            headers.join(','),
            ...data.map(row => row.map(escapeCsvField).join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'video_analysis_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <>
            <ChannelInputForm
                channelsInput={channelsInput}
                setChannelsInput={setChannelsInput}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                apiKeysReady={keysReady}
            />

            {!isLoading && trendAnalysis && (
                <TitleTrendAnalysisDisplay analysis={trendAnalysis} />
            )}

            {isLoading && (
                <div className="mt-12 flex flex-col items-center justify-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg text-indigo-400">Đang phân tích và nhận diện xu hướng... Quá trình này có thể mất vài phút.</p>
                </div>
            )}

            {error && (
                <div className="mt-12 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                </div>
            )}
            
            {!isLoading && originalResults.length > 0 && (
                <ResultsToolbar 
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    minViews={minViews}
                    setMinViews={setMinViews}
                    resultCount={displayedResults.length}
                    totalCount={originalResults.length}
                    onExport={handleExportToCsv}
                />
            )}

            {!isLoading && displayedResults.length > 0 && (
                <ResultsDisplay results={displayedResults} onSummaryUpdate={updateVideoSummary} />
            )}
            
            {!isLoading && originalResults.length > 0 && displayedResults.length === 0 && (
                <div className="mt-12 text-center text-gray-400">
                    <p>Không có video nào khớp với bộ lọc của bạn.</p>
                </div>
            )}
        </>
    );
};