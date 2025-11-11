import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from './components/ApiKeyManager';
import { VideoAnalysisTab } from './components/VideoAnalysisTab';
import { ChannelGrowthTab } from './components/ChannelGrowthTab';
import { ScriptWriterTab } from './components/ScriptWriterTab';
import { VideoListAnalysisTab } from './components/video-list-analysis/VideoListAnalysisTab';
import { KeyValidationScreen } from './components/KeyValidationScreen';
import { AnalyzedVideo, ChannelGrowthData, AccessKey } from './types';
import { fetchYoutubeApiKeys, fetchGeminiApiKeys, fetchAccessKeys } from './services/googleSheetService';
import { LoadingSpinner } from './components/LoadingSpinner';

const parseDate = (dateString: string): Date | null => {
    // Expects DD/MM/YYYY
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        // Check if date is valid
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
    }
    return null;
};


const App: React.FC = () => {
    const [youtubeApiKeys, setYoutubeApiKeys] = useState<string[]>([]);
    const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>([]);
    const [currentYoutubeKeyIndex, setCurrentYoutubeKeyIndex] = useState<number>(0);
    const [keysLoading, setKeysLoading] = useState<boolean>(true);
    const [keysError, setKeysError] = useState<string | null>(null);

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
    const [authLoading, setAuthLoading] = useState<boolean>(true);

    const [activeTab, setActiveTab] = useState<'analysis' | 'growth' | 'script' | 'videoListAnalysis'>('analysis');

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

    useEffect(() => {
        localStorage.setItem('videoAnalysisResults', JSON.stringify(videoAnalysisResults));
    }, [videoAnalysisResults]);

    useEffect(() => {
        localStorage.setItem('channelGrowthResults', JSON.stringify(channelGrowthResults));
    }, [channelGrowthResults]);


    useEffect(() => {
        const loadAllKeys = async () => {
            setKeysLoading(true);
            setAuthLoading(true);
            try {
                const [youtubeKeys, geminiKeys, fetchedAccessKeys] = await Promise.all([
                    fetchYoutubeApiKeys(),
                    fetchGeminiApiKeys(),
                    fetchAccessKeys()
                ]);

                setAccessKeys(fetchedAccessKeys);

                if (youtubeKeys.length === 0) {
                    setKeysError("Không tìm thấy YouTube API key nào trong Google Sheet.");
                } else {
                    setYoutubeApiKeys(youtubeKeys);
                    setKeysError(null);
                }
                setGeminiApiKeys(geminiKeys);

                const savedKey = localStorage.getItem('userAccessKey');
                if (savedKey) {
                    const foundKey = fetchedAccessKeys.find(k => k.key === savedKey);
                    if (foundKey) {
                        const expirationDate = parseDate(foundKey.expirationDate);
                        if (expirationDate) {
                            expirationDate.setHours(23, 59, 59, 999);
                            if (new Date() <= expirationDate) {
                                setIsAuthenticated(true);
                            } else {
                                localStorage.removeItem('userAccessKey');
                            }
                        } else {
                           localStorage.removeItem('userAccessKey');
                        }
                    } else {
                        localStorage.removeItem('userAccessKey');
                    }
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Không thể tải API keys hoặc access keys từ Google Sheet. Vui lòng kiểm tra lại.";
                setKeysError(errorMessage);
                console.error(err);
            } finally {
                setKeysLoading(false);
                setAuthLoading(false);
            }
        };
        loadAllKeys();
    }, []);

    const handleSuccessfulLogin = (key: string) => {
        localStorage.setItem('userAccessKey', key);
        setIsAuthenticated(true);
    };

    const TabButton: React.FC<{tabId: 'analysis' | 'growth' | 'script' | 'videoListAnalysis', children: React.ReactNode}> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tabId
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {children}
        </button>
    )

    const keysReady = youtubeApiKeys.length > 0 && !keysLoading && !keysError;

    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-indigo-400">Đang khởi tạo...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <KeyValidationScreen onSuccess={handleSuccessfulLogin} accessKeys={accessKeys} isLoading={keysLoading} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-6 relative">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        YouTube Channel Analyzer
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Phân tích, theo dõi tăng trưởng và sáng tạo kịch bản cho kênh YouTube của bạn.
                    </p>
                </header>
                
                <ApiKeyManager 
                    keysLoading={keysLoading}
                    keysError={keysError}
                    youtubeKeyCount={youtubeApiKeys.length}
                    geminiKeyCount={geminiApiKeys.length}
                />

                <div className="mt-8 mb-6 flex justify-center flex-wrap gap-2 bg-gray-800/50 p-1 rounded-lg max-w-xl mx-auto">
                    <TabButton tabId="analysis">Phân Tích Kênh</TabButton>
                    <TabButton tabId="growth">Tăng Trưởng Kênh</TabButton>
                    <TabButton tabId="videoListAnalysis">Phân Tích Videos</TabButton>
                    <TabButton tabId="script">Viết Kịch Bản AI</TabButton>
                </div>

                <main>
                    {activeTab === 'analysis' && (
                        <VideoAnalysisTab 
                            youtubeApiKeys={youtubeApiKeys}
                            currentYoutubeKeyIndex={currentYoutubeKeyIndex}
                            setCurrentYoutubeKeyIndex={setCurrentYoutubeKeyIndex}
                            keysReady={keysReady}
                            results={videoAnalysisResults}
                            setResults={setVideoAnalysisResults}
                        />
                    )}
                    {activeTab === 'growth' && (
                        <ChannelGrowthTab 
                            youtubeApiKeys={youtubeApiKeys}
                            currentYoutubeKeyIndex={currentYoutubeKeyIndex}
                            setCurrentYoutubeKeyIndex={setCurrentYoutubeKeyIndex}
                            keysReady={keysReady}
                            results={channelGrowthResults}
                            setResults={setChannelGrowthResults}
                        />
                    )}
                    {activeTab === 'videoListAnalysis' && (
                        <VideoListAnalysisTab
                             youtubeApiKeys={youtubeApiKeys}
                            currentYoutubeKeyIndex={currentYoutubeKeyIndex}
                            setCurrentYoutubeKeyIndex={setCurrentYoutubeKeyIndex}
                            keysReady={keysReady}
                        />
                    )}
                    {activeTab === 'script' && (
                        <ScriptWriterTab />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;
