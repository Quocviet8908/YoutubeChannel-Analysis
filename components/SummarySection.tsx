
import React from 'react';
import { VideoIcon, CommentIcon } from './icons';

interface SummarySectionProps {
    title: string;
    content: string;
    icon: 'video' | 'comment';
}

export const SummarySection: React.FC<SummarySectionProps> = ({ title, content, icon }) => {
    const IconComponent = icon === 'video' ? VideoIcon : CommentIcon;

    return (
        <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
            <h4 className="flex items-center text-md font-semibold text-indigo-300 mb-2">
                <IconComponent className="w-5 h-5 mr-2" />
                {title}
            </h4>
            <p className="text-sm text-gray-300 whitespace-pre-line">{content}</p>
        </div>
    );
};
