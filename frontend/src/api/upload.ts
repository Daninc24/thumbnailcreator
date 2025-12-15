import axiosInstance from "./axiosInstance";

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosInstance.post("/upload/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getUserImages = async (params?: {
  page?: number;
  limit?: number;
  processed?: boolean;
  type?: string;
  hasThumbnail?: boolean;
  search?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.processed !== undefined) queryParams.append("processed", params.processed.toString());
  if (params?.type) queryParams.append("type", params.type);
  if (params?.hasThumbnail) queryParams.append("hasThumbnail", params.hasThumbnail.toString());
  if (params?.search) queryParams.append("search", params.search);

  const queryString = queryParams.toString();
  const url = `/upload/my-images${queryString ? `?${queryString}` : ""}`;
  const res = await axiosInstance.get(url);
  return res.data;
};
