import axiosInstance from "./axiosInstance";

export interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    createdAt: string;
    stats: {
      totalImages: number;
      processedImages: number;
      thumbnailsCreated: number;
      credits: number;
    };
  };
}

export const getProfile = async (): Promise<UserProfileResponse> => {
  const res = await axiosInstance.get("/auth/profile");
  return res.data;
};

export const updateProfile = async (email: string): Promise<{ message: string; user: { id: string; email: string } }> => {
  const res = await axiosInstance.put("/auth/profile", { email });
  return res.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  const res = await axiosInstance.put("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data;
};

