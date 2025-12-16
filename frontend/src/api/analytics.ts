import axiosInstance from "./axiosInstance";

export interface AnalyticsResponse {
  analytics: {
    totalImages: number;
    bgRemoved: number;
    thumbnails: number;
    pending: number;
    lastUpload: string | null;
    totalProcessed: number;
    dailyStats: {
      date: string;
      uploaded: number;
      bgRemoved: number;
      thumbnails: number;
    }[];
    weeklyStats: {
      week: string;
      date: string;
      uploaded: number;
      bgRemoved: number;
      thumbnails: number;
    }[];
  };
}

export const getAnalytics = async (): Promise<AnalyticsResponse> => {
  const res = await axiosInstance.get("/upload/analytics");
  return res.data;
};

export const exportReport = async (): Promise<Blob> => {
  const res = await axiosInstance.get("/upload/export-report", {
    responseType: "blob",
  });
  return res.data;
};

