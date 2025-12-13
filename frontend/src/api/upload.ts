import axiosInstance from "./axiosInstance";

export interface UploadResponse {
  message: string;
  file: string;
}

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosInstance.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getUserImages = async (): Promise<{ images: { url: string }[] }> => {
  const res = await axiosInstance.get("/upload/my-images");
  return res.data;
};
