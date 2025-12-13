import axiosInstance from "./axiosInstance";

export interface AuthResponse {
  message: string;
}

export const registerUser = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await axiosInstance.post<AuthResponse>("/auth/register", { email, password });
  return res.data;
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await axiosInstance.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
};
