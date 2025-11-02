import React, { useState, useCallback, useMemo } from 'react';
import { ChannelInputForm } from './ChannelInputForm';
import { ResultsDisplay } from './ResultsDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { ResultsToolbar } from './ResultsToolbar';
import { convertIdentifierToChannelId, getChannelVideos, getVideoComments } from '../services/youtubeService';
import { summarizeComments } from '../services/geminiService';
import { AnalyzedVideo } from '../types';

interface VideoAnalysisTabProps {
    apiKey: string;
    geminiApiKey: string;
    results: AnalyzedVideo[];
    setResults: (results: AnalyzedVideo[]) => void;
}

const escapeCsvField = (field: any): string => {
    const stringField = String(field ?? '');
    if (/[",\n]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const VideoAnalysisTab: React.FC<VideoAnalysisTabProps> = ({ apiKey, geminiApiKey, results: originalResults, setResults: setOriginalResults }) => {
    const [channelsInput, setChannelsInput] = useState<string>(`https://www.youtube.com/@MrBeast
https://www.youtube.com/channel/UC295-Dw_tDNtZXFeAPAW6Aw
@mkbhd
https://www.youtube.com/@TheSleepyExplorer-r6o`);
    const [timeframe, setTimeframe] = useState<number>(30);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    // State for filtering and sorting
    const [sortOrder, setSortOrder] = useState<'ratio' | 'views'>('ratio');
    const [minViews, setMinViews] = useState<string>('');
    
    const apiKeysReady = !!apiKey && !!geminiApiKey;

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
        if (!apiKeysReady) return;

        setIsLoading(true);
        setError(null);
        setOriginalResults([]);

        const channelIdentifiers = parseChannelInput(channelsInput);
        
        if (channelIdentifiers.length === 0) {
            setError('Vui lòng nhập ít nhất một kênh YouTube hợp lệ (URL, ID hoặc @handle).');
            setIsLoading(false);
            return;
        }

        try {
            const allTopVideos: AnalyzedVideo[] = [];

            for (const identifier of channelIdentifiers) {
                const channelInfo = await convertIdentifierToChannelId(identifier, apiKey);
                if (!channelInfo) {
                    console.warn(`Không thể tìm thấy kênh cho: ${identifier}`);
                    continue;
                }
                
                const videos = await getChannelVideos(channelInfo.channelId, timeframe, apiKey);
                
                if (videos.length === 0) continue;

                const totalViews = videos.reduce((sum, video) => sum + video.viewCount, 0);
                const averageViews = videos.length > 0 ? totalViews / videos.length : 0;

                const potentialVideos = videos
                    .filter(video => video.viewCount > averageViews * 1.5)
                    .sort((a, b) => b.viewCount - a.viewCount);
                
                const top5Videos = potentialVideos.slice(0, 5);

                for (const video of top5Videos) {
                    const comments = await getVideoComments(video.id, apiKey);
                    const commentsSummary = await summarizeComments(comments, geminiApiKey);
                    
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

            setOriginalResults(allTopVideos);

        } catch (err: any) {
            console.error(err);
            setError(`Đã xảy ra lỗi: ${err.message}. Vui lòng kiểm tra API key và thử lại.`);
        } finally {
            setIsLoading(false);
        }
    }, [channelsInput, timeframe, apiKey, geminiApiKey, apiKeysReady, setOriginalResults]);

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
                apiKeysReady={apiKeysReady}
            />

            {isLoading && (
                <div className="mt-12 flex flex-col items-center justify-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg text-indigo-400">Đang phân tích... Quá trình này có thể mất vài phút.</p>
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
                <ResultsDisplay results={displayedResults} onSummaryUpdate={updateVideoSummary} geminiApiKey={geminiApiKey} />
            )}
            
            {!isLoading && originalResults.length > 0 && displayedResults.length === 0 && (
                <div className="mt-12 text-center text-gray-400">
                    <p>Không có video nào khớp với bộ lọc của bạn.</p>
                </div>
            )}
        </>
    );
};