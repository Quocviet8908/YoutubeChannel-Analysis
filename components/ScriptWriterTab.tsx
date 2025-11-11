import React, { useState, useCallback, useMemo } from 'react';
import { generateOutlineSuggestions, generateScriptForSection } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import type { OutlineData, FinalScript, ScriptLength, AidaPuzzleSection } from '../types';

// SVG Icons for buttons
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v2.586l1.293-1.293a1 1 0 111.414 1.414l-1.293 1.293V10a1 1 0 11-2 0V7.414l-1.293 1.293a1 1 0 01-1.414-1.414l1.293-1.293V4a1 1 0 011-1zM5 10a1 1 0 011-1h2.586l1.293-1.293a1 1 0 111.414 1.414L10 10.586V13a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414L5.414 10H3a1 1 0 110-2h2.414l1.293-1.293a1 1 0 011.414 1.414L7.414 10H5zM15 10a1 1 0 011-1h2.586l1.293-1.293a1 1 0 111.414 1.414L19.414 10H21a1 1 0 110 2h-1.586l-1.293 1.293a1 1 0 11-1.414-1.414l1.293-1.293V13a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414L15.414 10H13a1 1 0 110-2h2z" clipRule="evenodd" /></svg>;
const RefreshIcon = ({ spinning }: { spinning: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0121.5 13.5M20 20l-1.5-1.5A9 9 0 002.5 10.5" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>


export const ScriptWriterTab: React.FC = () => {
    const [idea, setIdea] = useState<string>('');
    const [length, setLength] = useState<ScriptLength>(1000);

    const [outlineSuggestions, setOutlineSuggestions] = useState<OutlineData[] | null>(null);
    const [selectedOutline, setSelectedOutline] = useState<OutlineData | null>(null);
    const [generatedSections, setGeneratedSections] = useState<Record<string, FinalScript>>({});

    const [isGeneratingOutline, setIsGeneratingOutline] = useState<boolean>(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
    const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<'vn' | 'en' | null>(null);


    const handleGenerateOutline = useCallback(async () => {
        if (!idea.trim()) {
            setError('Vui lòng nhập ý tưởng kịch bản.');
            return;
        }
        setIsGeneratingOutline(true);
        setError(null);
        setOutlineSuggestions(null);
        setSelectedOutline(null);
        setGeneratedSections({});
        try {
            const suggestions = await generateOutlineSuggestions(idea, length);
            setOutlineSuggestions(suggestions);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi không xác định.');
        } finally {
            setIsGeneratingOutline(false);
        }
    }, [idea, length]);
    
    const handleSelectOutline = useCallback((outlineToSelect: OutlineData) => {
        const outlineWithIds = {
            ...outlineToSelect,
            aidaOutline: outlineToSelect.aidaOutline.map((section, index) => ({
                ...section,
                id: `${Date.now()}-${index}`
            }))
        };
        setSelectedOutline(outlineWithIds);
    }, []);


    const handleGenerateSection = useCallback(async (section: AidaPuzzleSection) => {
        if (!selectedOutline) return;
        setGeneratingSectionId(section.id);
        setError(null);
        
        const scriptContext = selectedOutline.aidaOutline
            .filter(s => s.id !== section.id && generatedSections[s.id])
            .slice(0, selectedOutline.aidaOutline.indexOf(section))
            .map(s => generatedSections[s.id].vietnameseScript)
            .join('\n\n') || '';

        try {
            const scriptForSection = await generateScriptForSection(section, idea, selectedOutline, scriptContext);
            setGeneratedSections(prev => ({ ...prev, [section.id]: scriptForSection }));
        } catch (e) {
            setError(e instanceof Error ? e.message : `Lỗi khi tạo phần: ${section.title}`);
        } finally {
            setGeneratingSectionId(null);
        }
    }, [idea, selectedOutline, generatedSections]);

    const handleGenerateAll = useCallback(async () => {
        if (!selectedOutline) return;
        setIsGeneratingAll(true);
        for (const section of selectedOutline.aidaOutline) {
            if (!generatedSections[section.id]) {
                await handleGenerateSection(section);
            }
        }
        setIsGeneratingAll(false);
    }, [selectedOutline, generatedSections, handleGenerateSection]);

    const handleSectionContentChange = (sectionId: string, lang: 'vietnameseScript' | 'englishScript', value: string) => {
        setGeneratedSections(prev => ({
            ...prev,
            [sectionId]: {
                ...prev[sectionId],
                [lang]: value
            }
        }));
    };

    const fullVietnameseScript = useMemo(() =>
        selectedOutline?.aidaOutline
            .map(s => generatedSections[s.id]?.vietnameseScript || '')
            .join('\n\n'),
        [selectedOutline, generatedSections]
    );

    const fullEnglishScript = useMemo(() =>
        selectedOutline?.aidaOutline
            .map(s => generatedSections[s.id]?.englishScript || '')
            .join('\n\n'),
        [selectedOutline, generatedSections]
    );

    const totalWords = useMemo(() => fullVietnameseScript?.split(/\s+/).filter(Boolean).length || 0, [fullVietnameseScript]);

    const downloadScript = (content: string, filename: string) => {
        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    
    const handleCopy = (content: string, type: 'vn' | 'en') => {
        if (!navigator.clipboard) {
            setError('Trình duyệt của bạn không hỗ trợ sao chép.');
            return;
        }
        navigator.clipboard.writeText(content).then(() => {
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        }, (err) => {
            setError('Không thể sao chép: ' + err);
        });
    };
    
    const handleShare = async () => {
        const shareData = {
            title: `Kịch bản: ${idea.substring(0, 30)}...`,
            text: `KỊCH BẢN TIẾNG VIỆT:\n\n${fullVietnameseScript}\n\n------------------\n\nENGLISH SCRIPT:\n\n${fullEnglishScript}`,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                 if ((err as Error).name !== 'AbortError') {
                   console.error("Share failed:", err);
                   setError('Không thể chia sẻ: ' + (err as Error).message);
                }
            }
        } else {
            setError('Trình duyệt của bạn không hỗ trợ chức năng chia sẻ.');
        }
    };


    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white">AI Script Expander</h2>
                <p className="text-indigo-400 mt-1">Biến ý tưởng thành kịch bản lan truyền</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">Ý tưởng kịch bản</label>
                        <textarea
                            id="idea"
                            value={idea}
                            onChange={e => setIdea(e.target.value)}
                            placeholder="VD: Lịch sử và tương lai của các lỗ đen..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                            rows={3}
                            disabled={isGeneratingOutline || isGeneratingAll}
                        />
                    </div>
                    <div>
                        <label htmlFor="length" className="block text-sm font-medium text-gray-300 mb-2">Số từ mong muốn</label>
                        <input
                            id="length"
                            type="number"
                            value={length}
                            onChange={e => setLength(Number(e.target.value))}
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                            step={100}
                            min={100}
                            disabled={isGeneratingOutline || isGeneratingAll}
                        />
                    </div>
                </div>
                <button onClick={handleGenerateOutline} disabled={isGeneratingOutline || !idea.trim()} className="mt-6 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed">
                    {isGeneratingOutline ? <RefreshIcon spinning={true} /> : <SparklesIcon />}
                    {isGeneratingOutline ? 'Đang tìm kiếm ý tưởng...' : 'Tạo Gợi Ý Dàn Ý'}
                </button>
                {error && <div className="mt-4 text-red-300 bg-red-900/50 p-3 rounded-md text-sm">{error}</div>}
            </div>
            
            {isGeneratingOutline && (
                <div className="mt-12 flex flex-col items-center justify-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-lg text-indigo-400">AI đang phân tích và sáng tạo... Vui lòng chờ.</p>
                </div>
            )}

            {outlineSuggestions && !selectedOutline && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-center mb-4 text-white">Chọn một hướng đi cho kịch bản</h2>
                    <p className="text-center text-gray-400 mb-6">AI đã đề xuất 5 góc tiếp cận khác nhau cho ý tưởng của bạn.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {outlineSuggestions.map((suggestion, index) => (
                            <div 
                                key={index} 
                                onClick={() => handleSelectOutline(suggestion)}
                                className="bg-gray-800/70 p-5 rounded-xl border-2 border-gray-700 hover:border-indigo-500 cursor-pointer transition-all duration-300 transform hover:scale-105"
                            >
                                <h3 className="font-bold text-lg text-indigo-400">{suggestion.suggestionTitle}</h3>
                                <p className="text-sm text-gray-400 mt-2">Các điểm chính:</p>
                                <ul className="text-sm list-disc list-inside mt-1 space-y-1 text-gray-300">
                                   {suggestion.keyPoints.slice(0, 3).map((kp, i) => <li key={i}>{kp}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {selectedOutline && (
                <div className="mt-8 space-y-8">
                    {/* Outline Section */}
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-2xl font-bold text-white">Cấu Trúc Kịch Bản: <span className="text-indigo-400">{selectedOutline.suggestionTitle}</span></h2>
                             <button onClick={() => setSelectedOutline(null)} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                                <BackIcon/>
                                Chọn lại dàn ý
                             </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <h3 className="font-semibold text-indigo-400 mb-2">Key Points</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">{selectedOutline.keyPoints.map((p, i) => <li key={`kp-${i}`}>{p}</li>)}</ul>
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg">
                                <h3 className="font-semibold text-indigo-400 mb-2">Viral Points</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">{selectedOutline.viralPoints.map((p, i) => <li key={`vp-${i}`}>{p}</li>)}</ul>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-400 mb-2">Dàn Ý AIDA Giải Đố</h3>
                            {selectedOutline.aidaOutline.map((section, i) => (
                                <div key={section.id} className="p-3 border-l-2 border-gray-700 mb-2">
                                    <p className="font-semibold">{i + 1}. {section.title} (~{section.estimatedWordCount} từ)</p>
                                    <p className="text-sm text-gray-400 ml-4"><strong>Câu hỏi:</strong> {section.question}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Script Writing Section */}
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Viết Kịch Bản Chi Tiết</h2>
                            <button onClick={handleGenerateAll} disabled={isGeneratingAll || isGeneratingOutline || !!generatingSectionId} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center">
                                {isGeneratingAll ? <RefreshIcon spinning={true} /> : <SparklesIcon />}
                                <span className="ml-2">{isGeneratingAll ? 'Đang tạo...' : 'Tạo Tất Cả'}</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            {selectedOutline.aidaOutline.map((section) => (
                                <div key={section.id} className="bg-gray-900/50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-lg text-indigo-400">{section.title}</h3>
                                        <button onClick={() => handleGenerateSection(section)} disabled={isGeneratingAll || !!generatingSectionId} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-md transition duration-300 disabled:bg-gray-600 flex items-center">
                                            <RefreshIcon spinning={generatingSectionId === section.id} />
                                            <span className="ml-2">{generatedSections[section.id] ? 'Tạo lại' : 'Tạo'}</span>
                                        </button>
                                    </div>
                                    {generatedSections[section.id] && (
                                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                                            <textarea
                                                value={generatedSections[section.id].vietnameseScript}
                                                onChange={e => handleSectionContentChange(section.id, 'vietnameseScript', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-300 text-sm h-32 resize-y"
                                                placeholder="Nội dung Tiếng Việt..."
                                            />
                                            <textarea
                                                value={generatedSections[section.id].englishScript}
                                                onChange={e => handleSectionContentChange(section.id, 'englishScript', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-300 text-sm h-32 resize-y"
                                                placeholder="English content..."
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final Script Preview */}
                    {Object.keys(generatedSections).length > 0 && (
                         <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-white">Kịch Bản Hoàn Chỉnh</h2>
                                <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">Tổng số từ: {totalWords}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                 <button onClick={() => downloadScript(fullVietnameseScript || '', 'kich-ban-tieng-viet.txt')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                    <DownloadIcon /> Tải (VN)
                                </button>
                                <button onClick={() => handleCopy(fullVietnameseScript || '', 'vn')} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                    <CopyIcon /> {copied === 'vn' ? 'Đã chép!' : 'Chép (VN)'}
                                </button>
                                 <button onClick={() => downloadScript(fullEnglishScript || '', 'script-english.txt')} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                    <DownloadIcon /> Tải (EN)
                                </button>
                                 <button onClick={() => handleCopy(fullEnglishScript || '', 'en')} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                    <CopyIcon /> {copied === 'en' ? 'Đã chép!' : 'Chép (EN)'}
                                </button>
                                {navigator.share && (
                                     <button onClick={handleShare} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm">
                                        <ShareIcon /> Chia sẻ
                                    </button>
                                )}
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                 <div className="bg-gray-900/50 p-4 rounded-lg">
                                     <h3 className="font-semibold text-indigo-400 mb-2">Tiếng Việt</h3>
                                     <pre className="whitespace-pre-wrap text-gray-300 text-sm max-h-96 overflow-y-auto p-2 bg-gray-900 rounded-md">{fullVietnameseScript}</pre>
                                 </div>
                                 <div className="bg-gray-900/50 p-4 rounded-lg">
                                     <h3 className="font-semibold text-indigo-400 mb-2">Tiếng Anh</h3>
                                     <pre className="whitespace-pre-wrap text-gray-300 text-sm max-h-96 overflow-y-auto p-2 bg-gray-900 rounded-md">{fullEnglishScript}</pre>
                                 </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
