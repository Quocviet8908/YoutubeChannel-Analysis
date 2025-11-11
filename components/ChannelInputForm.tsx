import React from 'react';

interface ChannelInputFormProps {
    channelsInput: string;
    setChannelsInput: (value: string) => void;
    timeframe: number;
    setTimeframe: (value: number) => void;
    onAnalyze: () => void;
    isLoading: boolean;
    apiKeysReady: boolean;
}

export const ChannelInputForm: React.FC<ChannelInputFormProps> = ({
    channelsInput,
    setChannelsInput,
    timeframe,
    setTimeframe,
    onAnalyze,
    isLoading,
    apiKeysReady
}) => {
    const isButtonDisabled = isLoading || !apiKeysReady;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                    <label htmlFor="channel-ids" className="block text-sm font-medium text-gray-300 mb-2">
                        Danh sách Kênh (ID, URL, hoặc @handle - mỗi kênh một dòng)
                    </label>
                    <textarea
                        id="channel-ids"
                        rows={5}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
                        placeholder={`Vd:
https://www.youtube.com/@MrBeast
UC-lHJZR3Gqxm24_Vd_AJ5Yw
@mkbhd`}
                        value={channelsInput}
                        onChange={(e) => setChannelsInput(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="md:col-span-4 flex flex-col">
                    <label htmlFor="timeframe" className="block text-sm font-medium text-gray-300 mb-2">
                        Khung thời gian
                    </label>
                    <select
                        id="timeframe"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors flex-grow"
                        value={timeframe}
                        onChange={(e) => setTimeframe(Number(e.target.value))}
                        disabled={isLoading}
                    >
                        <option value={7}>7 ngày qua</option>
                        <option value={15}>15 ngày qua</option>
                        <option value={30}>30 ngày qua</option>
                    </select>
                </div>
            </div>
            <div className="mt-6 text-center">
                 <button
                    onClick={onAnalyze}
                    disabled={isButtonDisabled}
                    title={!apiKeysReady ? 'Vui lòng đợi API keys được tải hoặc khắc phục lỗi' : ''}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                >
                    {isLoading ? 'Đang xử lý...' : 'Bắt đầu Phân Tích'}
                </button>
            </div>
        </div>
    );
};
