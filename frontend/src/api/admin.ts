import axiosInstance from "./axiosInstance";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  subscription: {
    plan: string;
    quota: number;
    used: number;
    expiresAt: string | null;
  };
  totalImages: number;
  createdAt: string;
}

export const getAllUsers = async (): Promise<{ users: AdminUser[] }> => {
  const res = await axiosInstance.get("/admin/users");
  return res.data;
};

export const updateUserPlan = async (userId: string, plan: string): Promise<{ message: string }> => {
  const res = await axiosInstance.put(`/admin/users/${userId}/plan`, { plan });
  return res.data;
};

export const updateUserRole = async (userId: string, role: string): Promise<{ message: string }> => {
  const res = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
  return res.data;
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const res = await axiosInstance.delete(`/admin/users/${userId}`);
  return res.data;
};

export const resetUserQuota = async (userId: string): Promise<{ message: string }> => {
  const res = await axiosInstance.post(`/admin/users/${userId}/reset-quota`);
  return res.data;
};

