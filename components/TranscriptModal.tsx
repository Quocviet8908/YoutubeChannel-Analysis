import React, { useState } from 'react';

interface TranscriptModalProps {
    onClose: () => void;
    onSummarize: (transcript: string) => void;
    isLoading: boolean;
    videoTitle: string;
}

export const TranscriptModal: React.FC<TranscriptModalProps> = ({ onClose, onSummarize, isLoading, videoTitle }) => {
    const [transcript, setTranscript] = useState('');

    const handleSubmit = () => {
        if (transcript.trim()) {
            onSummarize(transcript.trim());
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-2xl transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex justify-between items-start">
                         <div>
                            <h2 className="text-xl font-bold text-indigo-300">Tóm tắt nội dung video</h2>
                            <p className="text-sm text-gray-400 mt-1 max-w-md truncate">Video: {videoTitle}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">&times;</button>
                    </div>

                    <div className="mt-4">
                        <label htmlFor="transcript-input" className="block text-sm font-medium text-gray-300 mb-2">
                           Dán nội dung transcript vào đây
                        </label>
                        <textarea
                            id="transcript-input"
                            rows={12}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
                            placeholder="Mở video trên YouTube, nhấp vào '...' -> 'Hiển thị bản chép lời', sau đó sao chép và dán vào đây."
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="bg-gray-800/50 px-6 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !transcript.trim()}
                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                    >
                        {isLoading ? 'Đang tóm tắt...' : 'Tóm tắt'}
                    </button>
                </div>
            </div>
        </div>
    );
};