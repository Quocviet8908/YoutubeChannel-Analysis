import React from 'react';
import { ChannelGrowthData } from '../types';

interface ChannelGrowthResultsProps {
    results: ChannelGrowthData[];
    timeframe: number;
}

const GrowthIndicator: React.FC<{ value: number }> = ({ value }) => {
    if (value === Infinity) {
        return <span className="text-green-400 font-bold">Mới nổi</span>;
    }
    if (value > 0) {
        return <span className="text-green-400 font-semibold">▲ {value.toFixed(1)}%</span>;
    }
    if (value < 0) {
        return <span className="text-red-400 font-semibold">▼ {Math.abs(value).toFixed(1)}%</span>;
    }
    return <span className="text-gray-400">0%</span>;
};

const escapeCsvField = (field: any): string => {
    const stringField = String(field ?? '');
    if (/[",\n]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

export const ChannelGrowthResults: React.FC<ChannelGrowthResultsProps> = ({ results, timeframe }) => {
    
    const handleExportToCsv = () => {
        if (results.length === 0) return;

        const headers = [
            'Hạng', 'Tên Kênh', 'URL Kênh', 'Tăng trưởng (%)',
            `Lượt xem TB (${timeframe} ngày qua)`, 'Lượt xem TB (kỳ trước)',
            'Số video (hiện tại)', 'Số video (kỳ trước)'
        ];

        const data = results.map(channel => [
            channel.rank,
            channel.channelName,
            `https://www.youtube.com/channel/${channel.channelId}`,
            channel.growthPercentage === Infinity ? 'Infinity' : channel.growthPercentage.toFixed(2),
            Math.round(channel.currentPeriodAvgViews),
            Math.round(channel.previousPeriodAvgViews),
            channel.currentVideoCount,
            channel.previousVideoCount
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
        link.setAttribute('download', 'channel_growth_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-12">
            <div className="flex justify-center items-center mb-8 gap-4">
                 <h2 className="text-3xl font-bold text-gray-200">
                    Xếp Hạng Tăng Trưởng Kênh
                </h2>
                <button
                    onClick={handleExportToCsv}
                    disabled={results.length === 0}
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Xuất CSV
                </button>
            </div>
           
            <div className="bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-300">Hạng</th>
                                <th className="p-4 text-sm font-semibold text-gray-300">Kênh</th>
                                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Tăng trưởng</th>
                                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Lượt xem TB ({timeframe} ngày qua)</th>
                                <th className="p-4 text-sm font-semibold text-gray-300 text-right">Lượt xem TB (kỳ trước)</th>
                                <th className="p-4 text-sm font-semibold text-gray-300 text-center">Số video (hiện tại / trước)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {results.map((channel) => (
                                <tr key={channel.channelId} className="hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4 font-bold text-lg text-center">{channel.rank}</td>
                                    <td className="p-4 font-medium">
                                        <a href={`https://www.youtube.com/channel/${channel.channelId}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">
                                            {channel.channelName}
                                        </a>
                                    </td>
                                    <td className="p-4 text-right">
                                        <GrowthIndicator value={channel.growthPercentage} />
                                    </td>
                                    <td className="p-4 text-gray-200 text-right">{Math.round(channel.currentPeriodAvgViews).toLocaleString('vi-VN')}</td>
                                    <td className="p-4 text-gray-400 text-right">{Math.round(channel.previousPeriodAvgViews).toLocaleString('vi-VN')}</td>
                                    <td className="p-4 text-gray-300 text-center">{channel.currentVideoCount} / {channel.previousVideoCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};