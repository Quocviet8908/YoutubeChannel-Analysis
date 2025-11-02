import React, { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
    youtubeApiKey: string;
    geminiApiKey: string;
    onSave: (youtubeKey: string, geminiKey: string) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ youtubeApiKey, geminiApiKey, onSave }) => {
    const [localYoutubeKey, setLocalYoutubeKey] = useState(youtubeApiKey);
    const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
    const [saved, setSaved] = useState(!!(youtubeApiKey && geminiApiKey));

    useEffect(() => {
        setLocalYoutubeKey(youtubeApiKey);
        setLocalGeminiKey(geminiApiKey);
    }, [youtubeApiKey, geminiApiKey]);

    const handleSave = () => {
        onSave(localYoutubeKey.trim(), localGeminiKey.trim());
        setSaved(true);
        setTimeout(() => setSaved(false), 2000); // Show saved message for 2 seconds
    };
    
    const keysProvided = youtubeApiKey && geminiApiKey;
    const keysChanged = localYoutubeKey !== youtubeApiKey || localGeminiKey !== geminiApiKey;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-700 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                    <label htmlFor="youtube-key" className="block text-sm font-medium text-gray-300 mb-2">
                        YouTube Data API v3 Key
                    </label>
                    <input
                        id="youtube-key"
                        type="password"
                        value={localYoutubeKey}
                        onChange={(e) => setLocalYoutubeKey(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
                        placeholder="Dán YouTube API Key"
                    />
                </div>
                <div className="md:col-span-5">
                    <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-300 mb-2">
                        Google Gemini API Key
                    </label>
                    <input
                        id="gemini-key"
                        type="password"
                        value={localGeminiKey}
                        onChange={(e) => setLocalGeminiKey(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
                        placeholder="Dán Gemini API Key"
                    />
                </div>
                <div className="md:col-span-2">
                     <button
                        onClick={handleSave}
                        disabled={!localYoutubeKey.trim() || !localGeminiKey.trim() || !keysChanged}
                        className="w-full h-10 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                    >
                        {saved ? 'Đã lưu!' : (keysProvided && !keysChanged ? 'Đã lưu' : 'Lưu Keys')}
                    </button>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-2 text-center md:text-left">
                Keys của bạn được lưu trữ an toàn trong bộ nhớ cục bộ của trình duyệt.
            </p>
        </div>
    );
};
