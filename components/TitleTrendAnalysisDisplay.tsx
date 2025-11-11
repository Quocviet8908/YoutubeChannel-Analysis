import React from 'react';
import { TitleTrendAnalysis } from '../types';

interface TitleTrendAnalysisDisplayProps {
    analysis: TitleTrendAnalysis;
}

const TrendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const ListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);


export const TitleTrendAnalysisDisplay: React.FC<TitleTrendAnalysisDisplayProps> = ({ analysis }) => {
    return (
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-6 text-indigo-300 flex items-center justify-center">
                <TrendIcon className="w-8 h-8 mr-3" />
                Phân Tích Xu Hướng Tiêu Đề
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                    <h3 className="flex items-center text-lg font-semibold text-gray-200 mb-3">
                        Đánh giá Tổng quan
                    </h3>
                    <p className="text-sm text-gray-300 whitespace-pre-line">{analysis.overview}</p>
                </div>
                 <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                     <h3 className="flex items-center text-lg font-semibold text-gray-200 mb-3">
                        <ListIcon className="w-6 h-6 mr-2" />
                        Các Tiêu Đề Trending
                    </h3>
                    <ul className="space-y-2">
                        {analysis.trendingTitles.map((title, index) => (
                            <li key={index} className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded-md">
                                <span className="text-indigo-400 mr-2">#</span>{title}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};