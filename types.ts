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