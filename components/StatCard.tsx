
import React from 'react';

interface StatCardProps {
    label: string;
    value: string;
    highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, highlight = false }) => {
    return (
        <div className={`p-4 rounded-lg ${highlight ? 'bg-indigo-900/70' : 'bg-gray-700/50'}`}>
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-indigo-300' : 'text-gray-200'}`}>{value}</p>
        </div>
    );
};
