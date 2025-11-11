import React from 'react';

interface ApiKeyManagerProps {
    keysLoading: boolean;
    keysError: string | null;
    youtubeKeyCount: number;
    geminiKeyCount: number;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ keysLoading, keysError, youtubeKeyCount, geminiKeyCount }) => {

    const getStatus = () => {
        if (keysLoading) {
            return (
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-300">Đang tải API Keys từ Google Sheet...</span>
                </div>
            );
        }
        if (keysError) {
            return (
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-300">{keysError}</span>
                </div>
            );
        }
        if (youtubeKeyCount > 0 || geminiKeyCount > 0) {
            return (
                <div className="flex items-center space-x-2">
                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-300">
                        Đã tải thành công: {youtubeKeyCount} YouTube Key(s) & {geminiKeyCount} Gemini Key(s).
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-700 mb-6 text-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <div className="font-semibold">{getStatus()}</div>
                 <p className="text-xs text-gray-500 text-center md:text-right">
                    API keys được tải tự động từ Google Sheet.
                </p>
            </div>
        </div>
    );
};