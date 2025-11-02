import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from './components/ApiKeyManager';
import { VideoAnalysisTab } from './components/VideoAnalysisTab';
import { ChannelGrowthTab } from './components/ChannelGrowthTab';
import { AnalyzedVideo, ChannelGrowthData } from './types';

const App: React.FC = () => {
    const [youtubeApiKey, setYoutubeApiKey] = useState<string>(() => localStorage.getItem('youtubeApiKey') || '');
    const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
    const [activeTab, setActiveTab] = useState<'analysis' | 'growth'>('analysis');

    // Lifted state for results from both tabs
    const [videoAnalysisResults, setVideoAnalysisResults] = useState<AnalyzedVideo[]>(() => {
        try {
            const saved = localStorage.getItem('videoAnalysisResults');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [channelGrowthResults, setChannelGrowthResults] = useState<ChannelGrowthData[]>(() => {
        try {
            const saved = localStorage.getItem('channelGrowthResults');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Effects to persist lifted state to localStorage
    useEffect(() => {
        localStorage.setItem('videoAnalysisResults', JSON.stringify(videoAnalysisResults));
    }, [videoAnalysisResults]);

    useEffect(() => {
        localStorage.setItem('channelGrowthResults', JSON.stringify(channelGrowthResults));
    }, [channelGrowthResults]);


    useEffect(() => {
        if (youtubeApiKey) {
            localStorage.setItem('youtubeApiKey', youtubeApiKey);
        } else {
            localStorage.removeItem('youtubeApiKey');
        }
    }, [youtubeApiKey]);

     useEffect(() => {
        if (geminiApiKey) {
            localStorage.setItem('geminiApiKey', geminiApiKey);
        } else {
            localStorage.removeItem('geminiApiKey');
        }
    }, [geminiApiKey]);

    const handleClearApiKeys = () => {
        setYoutubeApiKey('');
        setGeminiApiKey('');
        setVideoAnalysisResults([]);
        setChannelGrowthResults([]);
        localStorage.removeItem('youtubeApiKey');
        localStorage.removeItem('geminiApiKey');
        localStorage.removeItem('videoAnalysisResults');
        localStorage.removeItem('channelGrowthResults');
        // Reload to ensure all states are reset cleanly
        window.location.reload();
    }

    const handleApiKeysSave = (youtubeKey: string, geminiKey: string) => {
        setYoutubeApiKey(youtubeKey);
        setGeminiApiKey(geminiKey);
    };
    
    const TabButton: React.FC<{tabId: 'analysis' | 'growth', children: React.ReactNode}> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabId
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {children}
        </button>
    )

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-6 relative">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        YouTube Channel Analyzer
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Phân tích và tìm ra các video nổi bật nhất từ các kênh bạn theo dõi.
                    </p>
                    { (youtubeApiKey || geminiApiKey) &&
                        <button onClick={handleClearApiKeys} className="absolute top-0 right-0 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                            Xoá API Keys
                        </button>
                    }
                </header>
                
                <ApiKeyManager 
                    youtubeApiKey={youtubeApiKey}
                    geminiApiKey={geminiApiKey}
                    onSave={handleApiKeysSave}
                />

                <div className="mt-8 mb-6 flex justify-center space-x-2 bg-gray-800/50 p-1 rounded-lg max-w-sm mx-auto">
                    <TabButton tabId="analysis">Phân Tích Video</TabButton>
                    <TabButton tabId="growth">Tăng Trưởng Kênh</TabButton>
                </div>

                <main>
                    {activeTab === 'analysis' && (
                        <VideoAnalysisTab 
                            apiKey={youtubeApiKey} 
                            geminiApiKey={geminiApiKey}
                            results={videoAnalysisResults}
                            setResults={setVideoAnalysisResults}
                        />
                    )}
                    {activeTab === 'growth' && (
                        <ChannelGrowthTab 
                            apiKey={youtubeApiKey}
                            results={channelGrowthResults}
                            setResults={setChannelGrowthResults}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;