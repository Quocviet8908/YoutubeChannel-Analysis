import React from 'react';
import { DetailedVideoAnalysis } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';

interface VideoListResultCardProps {
    result: DetailedVideoAnalysis;
}

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export const VideoListResultCard: React.FC<VideoListResultCardProps> = ({ result }) => {
    
    const handleDownload = () => {
        if (result.status !== 'completed') return;

        const content = `
==================================================
VIDEO ANALYSIS REPORT
==================================================

VIDEO URL: https://www.youtube.com/watch?v=${result.id}
TIÊU ĐỀ: ${result.title}

--------------------------------------------------
MÔ TẢ VIDEO
--------------------------------------------------
${result.description || '(Không có mô tả)'}

--------------------------------------------------
TAGS
--------------------------------------------------
${result.tags.length > 0 ? result.tags.join(', ') : '(Không có tags)'}

==================================================
PHÂN TÍCH INSIGHT KHÁN GIẢ (AI)
==================================================
${result.audienceInsight}

==================================================
TẤT CẢ BÌNH LUẬN (${result.allComments.length} bình luận)
==================================================

${result.allComments.join('\n\n---\n\n')}
`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Sanitize title for filename
        const safeFilename = result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `analysis_${safeFilename.substring(0, 50)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const cardBaseClasses = "relative bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700 overflow-hidden";

    if (result.status === 'loading') {
        return (
            <div className={`${cardBaseClasses} p-6 flex items-center space-x-4`}>
                <LoadingSpinner />
                <div>
                    <p className="font-semibold text-gray-300">Đang xử lý video...</p>
                    <p className="text-sm text-gray-500 truncate max-w-lg">{result.title}</p>
                </div>
            </div>
        );
    }

    if (result.status === 'error') {
        return (
            <div className={`${cardBaseClasses} border-red-700/50 p-6`}>
                 <h3 className="text-xl font-bold text-red-300">Đã xảy ra lỗi</h3>
                 <p className="text-sm text-gray-400 mt-1 mb-3 max-w-xl truncate">Video: {result.title}</p>
                 <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md">{result.error}</p>
            </div>
        );
    }

    return (
        <div className={`${cardBaseClasses} transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-600 p-6`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <a href={`https://www.youtube.com/watch?v=${result.id}`} target="_blank" rel="noopener noreferrer">
                        <img
                            src={result.thumbnailUrl}
                            alt={result.title}
                            className="w-full rounded-lg shadow-lg mb-4 aspect-video object-cover"
                        />
                    </a>
                    <h3 className="text-xl font-bold text-gray-100">
                         <a href={`https://www.youtube.com/watch?v=${result.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                            {result.title}
                        </a>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {result.id}</p>
                </div>

                <div className="lg:col-span-8">
                     <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                        <h4 className="flex items-center text-md font-semibold text-indigo-300 mb-2">
                           Phân tích Insight Khán giả (AI)
                        </h4>
                        <p className="text-sm text-gray-300 whitespace-pre-line max-h-48 overflow-y-auto">{result.audienceInsight}</p>
                    </div>
                     <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-400">
                           <p>Số bình luận đã tìm thấy: <span className="font-bold text-gray-200">{result.allComments.length.toLocaleString('vi-VN')}</span></p>
                            {result.commentCount && <p>Tổng số bình luận (ước tính): <span className="font-bold text-gray-200">{parseInt(result.commentCount, 10).toLocaleString('vi-VN')}</span></p>}
                        </div>
                        <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                           <DownloadIcon /> Tải báo cáo (.txt)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
