import axiosInstance from "./axiosInstance";

export interface AuthResponse {
  message: string;
  token?: string;
}

export const registerUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const res = await axiosInstance.post<AuthResponse>("/auth/register", { email, password });
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message || "Registration failed";
    throw new Error(msg);
  }
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const res = await axiosInstance.post<AuthResponse>("/auth/login", { email, password });
    return res.data;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message || "Login failed";
    throw new Error(msg);
  }
};
