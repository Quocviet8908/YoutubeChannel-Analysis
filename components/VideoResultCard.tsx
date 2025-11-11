import React, { useState } from 'react';
import { AnalyzedVideo } from '../types';
import { StatCard } from './StatCard';
import { SummarySection } from './SummarySection';
import { TranscriptModal } from './TranscriptModal';
import { summarizeText } from '../services/geminiService';

interface VideoResultCardProps {
    video: AnalyzedVideo;
    rank: number;
    onSummaryUpdate: (videoId: string, summary: string) => void;
}

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    const colorClasses =
        rank === 1 ? 'bg-amber-400 text-amber-900' :
        rank === 2 ? 'bg-slate-300 text-slate-800' :
        rank === 3 ? 'bg-yellow-600 text-yellow-100' :
        'bg-indigo-500 text-indigo-100';

    return (
        <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg transform -rotate-12 ${colorClasses}`}>
            #{rank}
        </div>
    );
};

export const VideoResultCard: React.FC<VideoResultCardProps> = ({ video, rank, onSummaryUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummarize = async (transcript: string) => {
        setIsSummarizing(true);
        const summary = await summarizeText(transcript, video.title);
        onSummaryUpdate(video.id, summary);
        setIsSummarizing(false);
        setIsModalOpen(false);
    }

    return (
        <>
            <div className="relative bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-600">
                <RankBadge rank={rank} />
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Thumbnail and Title */}
                        <div className="lg:col-span-4">
                            <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    className="w-full rounded-lg shadow-lg mb-4 aspect-video object-cover"
                                />
                            </a>
                            <h3 className="text-xl font-bold text-gray-100">
                                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                                    {video.title}
                                </a>
                            </h3>
                            <a href={`https://www.youtube.com/channel/${video.channelId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 mt-1 block hover:text-indigo-400 transition-colors">
                                Kênh: {video.channelName}
                            </a>
                        </div>

                        {/* Right Column: Stats and Summaries */}
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <StatCard label="Lượt xem" value={video.viewCount.toLocaleString('vi-VN')} />
                                <StatCard label="Lượt xem TB kênh" value={Math.round(video.channelAverageViews).toLocaleString('vi-VN')} />
                                <StatCard label="Tỷ lệ Views / TB" value={`${video.ratio.toFixed(2)}x`} highlight={true} />
                            </div>

                            <div className="space-y-4">
                                {video.videoSummary && (
                                    <SummarySection title="Tóm tắt nội dung Video" content={video.videoSummary} icon="video" />
                                )}
                                <SummarySection title="Phản hồi của khán giả" content={video.commentsSummary} icon="comment" />
                            </div>

                            {!video.videoSummary && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/50 hover:border-indigo-500 rounded-full px-4 py-2 transition-colors"
                                    >
                                        + Thêm Transcript & Tóm tắt Video
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <TranscriptModal
                    onClose={() => setIsModalOpen(false)}
                    onSummarize={handleSummarize}
                    isLoading={isSummarizing}
                    videoTitle={video.title}
                />
            )}
        </>
    );
};
