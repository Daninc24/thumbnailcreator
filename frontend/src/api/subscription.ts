import axiosInstance from "./axiosInstance";

export interface Subscription {
  plan: string;
  quota: number;
  used: number;
  expiresAt: string | null;
  resetAt: string | null;
  remaining: number;
}

export const getSubscription = async (): Promise<{ subscription: Subscription }> => {
  const res = await axiosInstance.get("/auth/subscription");
  return res.data;
};

export const subscribeUser = async (plan: string): Promise<{ message: string; subscription: Subscription }> => {
  const res = await axiosInstance.post("/auth/subscribe", { plan });
  return res.data;
};

export const resetQuota = async (): Promise<{ message: string; subscription: Subscription }> => {
  const res = await axiosInstance.post("/auth/reset-quota");
  return res.data;
};
