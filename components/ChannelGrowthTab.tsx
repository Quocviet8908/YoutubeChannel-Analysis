import React, { useState, useCallback } from 'react';
import { ChannelInputForm } from './ChannelInputForm';
import { LoadingSpinner } from './LoadingSpinner';
import { ChannelGrowthResults } from './ChannelGrowthResults';
import { convertIdentifierToChannelId, calculateChannelGrowth } from '../services/youtubeService';
import { ChannelGrowthData } from '../types';

interface ChannelGrowthTabProps {
    apiKey: string;
    results: ChannelGrowthData[];
    setResults: (results: ChannelGrowthData[]) => void;
}

export const ChannelGrowthTab: React.FC<ChannelGrowthTabProps> = ({ apiKey, results, setResults }) => {
    const [channelsInput, setChannelsInput] = useState<string>(`https://www.youtube.com/@MrBeast
https://www.youtube.com/@mkbhd`);
    const [timeframe, setTimeframe] = useState<number>(30);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const apiKeysReady = !!apiKey;

     const parseChannelInput = (input: string): string[] => {
        return input.split(/[\n,]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    const handleAnalyze = useCallback(async () => {
        if (!apiKeysReady) return;

        setIsLoading(true);
        setError(null);
        setResults([]);

        const channelIdentifiers = parseChannelInput(channelsInput);
        
        if (channelIdentifiers.length === 0) {
            setError('Vui lòng nhập ít nhất một kênh YouTube hợp lệ (URL, ID hoặc @handle).');
            setIsLoading(false);
            return;
        }

        try {
            const growthDataPromises = channelIdentifiers.map(async (identifier) => {
                const channelInfo = await convertIdentifierToChannelId(identifier, apiKey);
                if (!channelInfo) {
                    console.warn(`Không thể tìm thấy kênh cho: ${identifier}`);
                    return null;
                }
                
                const growthStats = await calculateChannelGrowth(channelInfo.channelId, timeframe, apiKey);
                
                return {
                    channelId: channelInfo.channelId,
                    channelName: channelInfo.channelName,
                    ...growthStats
                };
            });
            
            const settledResults = await Promise.all(growthDataPromises);
            const validResults = settledResults.filter(r => r !== null) as Omit<ChannelGrowthData, 'rank'>[];

            const sortedResults = validResults
                .sort((a, b) => b.growthPercentage - a.growthPercentage)
                .map((result, index) => ({ ...result, rank: index + 1 }));

            setResults(sortedResults);

        } catch (err: any) {
            console.error(err);
            setError(`Đã xảy ra lỗi: ${err.message}. Vui lòng kiểm tra API key và thử lại.`);
        } finally {
            setIsLoading(false);
        }
    }, [channelsInput, timeframe, apiKey, apiKeysReady, setResults]);

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
                    <p className="mt-4 text-lg text-indigo-400">Đang tính toán tăng trưởng... Việc này có thể mất chút thời gian.</p>
                </div>
            )}

            {error && (
                <div className="mt-12 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && results.length > 0 && (
                <ChannelGrowthResults results={results} timeframe={timeframe}/>
            )}
        </>
    );
};