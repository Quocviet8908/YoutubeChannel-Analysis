import { Video } from '../types';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const handleApiError = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json();
        const message = errorData.error?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }
    return response.json();
}

export const convertIdentifierToChannelId = async (identifier: string, apiKey: string): Promise<{ channelId: string; channelName: string } | null> => {
    let params: URLSearchParams;
    const trimmedIdentifier = identifier.trim();

    const channelIdRegex = /^(UC[\w-]{22,})$/;
    const urlRegex = /youtube\.com\/(channel\/(UC[\w-]{22,})|c\/([\w-]+)|@([\w.-]+))/;
    const handleRegex = /^@([\w.-]+)$/;
    
    const urlMatch = trimmedIdentifier.match(urlRegex);
    const handleMatch = trimmedIdentifier.match(handleRegex);

    if (channelIdRegex.test(trimmedIdentifier)) {
        params = new URLSearchParams({
            part: 'snippet',
            id: trimmedIdentifier,
            key: apiKey,
        });
    } else if (urlMatch || handleMatch) {
        const username = urlMatch ? (urlMatch[4] || urlMatch[3]) : handleMatch ? handleMatch[1] : null;
        if(username) {
            params = new URLSearchParams({
                part: 'snippet',
                forHandle: username,
                key: apiKey,
            });
        } else { // Fallback to search for channel ID from URL
             params = new URLSearchParams({
                part: 'snippet',
                id: urlMatch[2],
                key: apiKey,
            });
        }
    } else { // Fallback to search
        params = new URLSearchParams({
            part: 'snippet',
            q: trimmedIdentifier,
            type: 'channel',
            maxResults: '1',
            key: apiKey,
        });
        const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
        const data = await handleApiError(response);
        if (data.items && data.items.length > 0) {
            return {
                channelId: data.items[0].snippet.channelId,
                channelName: data.items[0].snippet.channelTitle,
            };
        }
        return null;
    }

    const response = await fetch(`${API_BASE_URL}/channels?${params.toString()}`);
    const data = await handleApiError(response);
    if (data.items && data.items.length > 0) {
        return {
            channelId: data.items[0].id,
            channelName: data.items[0].snippet.title,
        };
    }

    return null;
};


const getVideosInDateRange = async (channelId: string, startDate: string, endDate: string, apiKey: string): Promise<Video[]> => {
     const searchParams = new URLSearchParams({
        part: 'snippet',
        channelId: channelId,
        order: 'date',
        type: 'video',
        maxResults: '50',
        publishedAfter: startDate,
        publishedBefore: endDate,
        key: apiKey,
    });

    const searchResponse = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`);
    const searchData = await handleApiError(searchResponse);

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    if (!videoIds) {
        return [];
    }

    const videosParams = new URLSearchParams({
        part: 'snippet,statistics',
        id: videoIds,
        key: apiKey,
    });

    const videosResponse = await fetch(`${API_BASE_URL}/videos?${videosParams.toString()}`);
    const videosData = await handleApiError(videosResponse);

    if (!videosData.items) return [];

    return videosData.items.map((item: any): Video => ({
        id: item.id,
        title: item.snippet.title,
        viewCount: parseInt(item.statistics.viewCount, 10) || 0,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    }));
}


export const getChannelVideos = async (channelId: string, days: number, apiKey: string): Promise<Video[]> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    return getVideosInDateRange(channelId, startDate.toISOString(), endDate.toISOString(), apiKey);
};


export const getVideoComments = async (videoId: string, apiKey: string): Promise<string[]> => {
    const params = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        order: 'relevance',
        textFormat: 'plainText',
        maxResults: '50',
        key: apiKey,
    });

    try {
        const response = await fetch(`${API_BASE_URL}/commentThreads?${params.toString()}`);
        const data = await handleApiError(response);

        return data.items.map((item: any) => item.snippet.topLevelComment.snippet.textDisplay);
    } catch (error: any) {
        // Comments can be disabled, so we don't want this to crash the whole analysis
        if (error.message && error.message.includes('disabled comments')) {
            return ["Bình luận đã bị tắt cho video này."];
        }
        console.error(`Could not fetch comments for video ${videoId}:`, error);
        return ["Không thể tải được bình luận."];
    }
};

export const calculateChannelGrowth = async (channelId: string, timeframeDays: number, apiKey: string) => {
    const now = new Date();
    
    // Current period
    const currentPeriodEnd = new Date(now);
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - timeframeDays);

    // Previous period
    const previousPeriodEnd = new Date(currentPeriodStart);
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - timeframeDays);

    const [currentVideos, previousVideos] = await Promise.all([
        getVideosInDateRange(channelId, currentPeriodStart.toISOString(), currentPeriodEnd.toISOString(), apiKey),
        getVideosInDateRange(channelId, previousPeriodStart.toISOString(), previousPeriodEnd.toISOString(), apiKey)
    ]);

    const calculateAverage = (videos: Video[]) => {
        if (videos.length === 0) return 0;
        const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
        return totalViews / videos.length;
    }

    const currentPeriodAvgViews = calculateAverage(currentVideos);
    const previousPeriodAvgViews = calculateAverage(previousVideos);

    let growthPercentage = 0;
    if (previousPeriodAvgViews > 0) {
        growthPercentage = ((currentPeriodAvgViews - previousPeriodAvgViews) / previousPeriodAvgViews) * 100;
    } else if (currentPeriodAvgViews > 0) {
        growthPercentage = Infinity; // Handle case of growth from zero
    }
    
    return {
        currentPeriodAvgViews,
        previousPeriodAvgViews,
        growthPercentage,
        currentVideoCount: currentVideos.length,
        previousVideoCount: previousVideos.length
    };
};