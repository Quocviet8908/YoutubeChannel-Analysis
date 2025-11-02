import React from 'react';

interface ResultsToolbarProps {
    sortOrder: 'ratio' | 'views';
    setSortOrder: (order: 'ratio' | 'views') => void;
    minViews: string;
    setMinViews: (views: string) => void;
    resultCount: number;
    totalCount: number;
    onExport: () => void;
}

export const ResultsToolbar: React.FC<ResultsToolbarProps> = ({
    sortOrder,
    setSortOrder,
    minViews,
    setMinViews,
    resultCount,
    totalCount,
    onExport
}) => {
    return (
        <div className="my-8 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-300">Sắp xếp theo:</label>
                <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg">
                    <button
                        onClick={() => setSortOrder('ratio')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${sortOrder === 'ratio' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Tỷ Lệ
                    </button>
                    <button
                        onClick={() => setSortOrder('views')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${sortOrder === 'views' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        Lượt Xem
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor="min-views" className="text-sm font-medium text-gray-300">Lượt xem tối thiểu:</label>
                <input
                    id="min-views"
                    type="number"
                    value={minViews}
                    onChange={(e) => setMinViews(e.target.value)}
                    placeholder="Vd: 10000"
                    className="w-32 bg-gray-900 border border-gray-600 rounded-lg p-2 text-sm text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
             <div className="text-sm text-gray-400">
                Hiển thị <strong>{resultCount}</strong> trên <strong>{totalCount}</strong> kết quả
            </div>
            <div>
                 <button
                    onClick={onExport}
                    disabled={resultCount === 0}
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Xuất CSV
                </button>
            </div>
        </div>
    );
};