import React from 'react';
import { AnalyzedVideo } from '../types';
import { VideoResultCard } from './VideoResultCard';

interface ResultsDisplayProps {
    results: AnalyzedVideo[];
    onSummaryUpdate: (videoId: string, summary: string) => void;
    geminiApiKey: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onSummaryUpdate, geminiApiKey }) => {
    return (
        <div className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-200">
                Kết Quả Phân Tích
            </h2>
            <div className="space-y-6">
                {results.map((video, index) => (
                    <VideoResultCard 
                        key={video.id} 
                        video={video} 
                        rank={index + 1}
                        onSummaryUpdate={onSummaryUpdate}
                        geminiApiKey={geminiApiKey}
                    />
                ))}
            </div>
        </div>
    );
};