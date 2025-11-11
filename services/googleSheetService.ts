import { AccessKey } from '../types';

const GOOGLE_SHEET_ID = '1uyjoE9WYJ2SUs0PpULjAQ-T3Ty9AQDIMxr3zBSfcExU';
// Renamed for clarity as we'll be adding sheet names
const BASE_CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

const parseCSV = (csvText: string): string[][] => {
    let text = csvText;
    // Remove BOM (Byte Order Mark) if it exists
    if (text.startsWith('\uFEFF')) {
        text = text.substring(1);
    }

    const rows = text.split('\n')
        .map(row => row.trim())
        .filter(row => row.length > 0); // Filter out empty lines

    return rows.map(row => {
        // A simple split by comma. This won't handle commas inside quoted fields,
        // but it's sufficient for the simple key-value format we expect.
        return row.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
    });
};


const fetchAndParseSheet = async (sheetName?: string): Promise<string[][]> => {
    let url = BASE_CSV_EXPORT_URL;
    if (sheetName) {
        url += `&sheet=${encodeURIComponent(sheetName)}`;
    }
    // Add a cache-busting parameter to the URL
    url += `&_=${new Date().getTime()}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheet (sheet: ${sheetName || 'default'}): ${response.statusText}`);
    }

    const csvText = await response.text();
    // Check if the response is HTML, which indicates an error (e.g., sheet not found, not public)
    if (csvText.trim().toLowerCase().startsWith('<!doctype html>') || csvText.trim().toLowerCase().startsWith('<html')) {
         throw new Error(`Could not retrieve CSV data for sheet "${sheetName}". The sheet might not exist, or the Google Sheet is not public ("Anyone with the link can view").`);
    }

    return parseCSV(csvText);
};

const getKeysFromColumn = (data: string[][], columnName: string): string[] => {
    if (data.length < 2) { // Header + at least one key
        return [];
    }
    
    const headers = data[0].map(h => h.toUpperCase().trim());
    const keyIndex = headers.indexOf(columnName.toUpperCase());

    if (keyIndex === -1) {
        console.error(`Column '${columnName}' not found in the Google Sheet. Please check the header name.`);
        return [];
    }

    return data
        .slice(1) // Skip header row
        .map(row => row[keyIndex])
        .filter(key => key && key.length > 0); // Filter out empty or undefined keys
};


export const fetchYoutubeApiKeys = async (): Promise<string[]> => {
    try {
        const data = await fetchAndParseSheet(); // Fetches from the first sheet by default
        return getKeysFromColumn(data, 'API Key Youtube');
    } catch (error) {
        console.error("Error fetching or parsing YouTube API keys from Google Sheet:", error);
        throw error;
    }
};

export const fetchGeminiApiKeys = async (): Promise<string[]> => {
    try {
        const data = await fetchAndParseSheet(); // Fetches from the first sheet by default
        return getKeysFromColumn(data, 'API Gemini');
    } catch (error) {
        console.error("Error fetching or parsing Gemini API keys from Google Sheet:", error);
        throw error;
    }
};

// Helper to sanitize headers for robust matching by removing diacritics and converting to lowercase
const sanitizeHeader = (header: string): string => {
    if (!header) return '';
    return header
        .trim()
        .toLowerCase()
        // Normalize to separate diacritics (e.g., 'ệ' -> 'e' + '̣') and then remove them
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const getAccessKeys = (data: string[][]): { keys: AccessKey[], headersFound: string[] } => {
    // Find the first row with actual content to use as the header
    const headerRowIndex = data.findIndex(row => row.some(cell => cell && cell.trim() !== ''));
    if (headerRowIndex === -1) {
        return { keys: [], headersFound: [] };
    }
    
    const originalHeaders = data[headerRowIndex];
    const sanitizedHeaders = originalHeaders.map(sanitizeHeader);
    const dataRows = data.slice(headerRowIndex + 1);

    // Use flexible matching on sanitized headers.
    // CRITICAL: Exclude headers with "api" when searching for the access key to avoid matching "API Key Youtube".
    const keyIndex = sanitizedHeaders.findIndex(h => (h.includes('key') || h.includes('khoa')) && !h.includes('api'));
    const expirationIndex = sanitizedHeaders.findIndex(h => h.includes('exp') || (h.includes('het') && h.includes('han')));

    if (keyIndex === -1 || expirationIndex === -1) {
        // Return empty keys but include the headers for the error message
        return { keys: [], headersFound: originalHeaders };
    }

    const keys = dataRows
        // Ensure row has data in the required columns and is not completely empty
        .filter(row => row.length > Math.max(keyIndex, expirationIndex) && row.some(cell => cell && cell.trim() !== ''))
        .map(row => ({
            key: row[keyIndex],
            expirationDate: row[expirationIndex]
        }))
        .filter(item => item.key && item.expirationDate);

    return { keys, headersFound: originalHeaders };
};

export const fetchAccessKeys = async (): Promise<AccessKey[]> => {
    let data;
    try {
        // Fetch from the first/default sheet, aligning with other key fetches.
        data = await fetchAndParseSheet();
    } catch (error) {
        console.error("Failed to fetch access keys from the default sheet.", error);
        throw new Error("Không thể tải access keys từ Google Sheet.");
    }
    
    const { keys, headersFound } = getAccessKeys(data);

    // If getAccessKeys returned empty but there was data in the sheet, it means headers were not found.
    // The second condition checks if the sheet is not empty.
    if (keys.length === 0 && data.some(row => row.some(cell => cell && cell.trim() !== ''))) {
        throw new Error(`Không tìm thấy các cột 'Key' ('Khóa') và/hoặc 'Expiration date' ('Ngày hết hạn') trong Google Sheet. Các cột đã tìm thấy là: [${headersFound.join(', ')}]`);
    }

    return keys;
};