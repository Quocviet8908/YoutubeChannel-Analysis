export interface Video {
  id: string;
  title: string;
  viewCount: number;
  thumbnailUrl: string;
}

export interface ChannelAnalysis {
  channelId: string;
  channelName: string;
  averageViews: number;
  topVideos: AnalyzedVideo[];
}

export interface AnalyzedVideo extends Video {
  channelId: string;
  channelName: string;
  channelAverageViews: number;
  ratio: number;
  commentsSummary: string;
  videoSummary?: string;
}

export interface ChannelGrowthData {
    rank: number;
    channelId: string;
    channelName: string;
    currentPeriodAvgViews: number;
    previousPeriodAvgViews: number;
    growthPercentage: number;
    currentVideoCount: number;
    previousVideoCount: number;
}

// New type for Key Validation
export interface AccessKey {
  key: string;
  expirationDate: string;
}


// New types for Script Writer
export type ScriptLength = number;

export interface AidaPuzzleSection {
    id: string;
    title: string;
    question: string;
    points: string[];
    estimatedWordCount: number;
}

export interface OutlineData {
    suggestionTitle: string;
    keyPoints: string[];
    viralPoints: string[];
    aidaOutline: AidaPuzzleSection[];
}

export interface FinalScript {
    vietnameseScript: string;
    englishScript: string;
}

// New type for Title Trend Analysis
export interface TitleTrendAnalysis {
  overview: string;
  trendingTitles: string[];
}

// New type for detailed video analysis
export interface DetailedVideoAnalysis {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailUrl: string;
  allComments: string[];
  audienceInsight: string;
  status: 'loading' | 'completed' | 'error';
  error?: string;
  commentCount: string | null;
}
