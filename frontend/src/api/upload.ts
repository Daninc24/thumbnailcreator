import axiosInstance from "./axiosInstance";

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosInstance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getUserImages = async () => {
  const res = await axiosInstance.get("/upload/my-images");
  return res.data;
};
