import React, { useState } from 'react';
import { AccessKey } from '../types';

interface KeyValidationScreenProps {
    onSuccess: (key: string) => void;
    accessKeys: AccessKey[];
    isLoading: boolean;
}

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

export const KeyValidationScreen: React.FC<KeyValidationScreenProps> = ({ onSuccess, accessKeys, isLoading }) => {
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!inputKey.trim()) {
            setError('Vui lòng nhập key.');
            return;
        }

        const foundKey = accessKeys.find(k => k.key === inputKey.trim());

        if (!foundKey) {
            setError('Key không hợp lệ. Vui lòng thử lại.');
            return;
        }
        
        const expirationDate = parseDate(foundKey.expirationDate);
        if (!expirationDate) {
            setError('Định dạng ngày hết hạn không hợp lệ trong Sheet. Vui lòng liên hệ quản trị viên.');
            return;
        }

        // Set time to end of day for comparison
        expirationDate.setHours(23, 59, 59, 999);
        
        const now = new Date();
        
        if (now > expirationDate) {
            setError('Key đã hết hạn. Vui lòng liên hệ quản trị viên để gia hạn.');
            return;
        }

        onSuccess(foundKey.key);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-700 space-y-6">
                    <header className="text-center">
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                            YouTube Channel Analyzer
                        </h1>
                        <p className="mt-2 text-gray-400">Vui lòng nhập key để tiếp tục</p>
                    </header>
                    
                    <div>
                        <label htmlFor="access-key" className="sr-only">Access Key</label>
                        <input
                            id="access-key"
                            type="text"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="Nhập access key của bạn"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-500"
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-transform transform hover:scale-105"
                    >
                        {isLoading ? 'Đang kiểm tra...' : 'Xác nhận'}
                    </button>
                </form>
            </div>
        </div>
    );
};
