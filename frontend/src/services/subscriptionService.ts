import { io, Socket } from "socket.io-client";
import axiosInstance from "../api/axiosInstance";
import { toast } from "../components/Toast";

interface SubscriptionData {
  plan: string;
  quota: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  resetAt: string;
  expiresAt: string;
  isAdmin: boolean;
}

interface SubscriptionUpdateData {
  plan: string;
  quota: number;
  used: number;
  expiresAt: string;
  paymentMethod?: string;
  receiptNumber?: string;
  message: string;
}

class SubscriptionService {
  private socket: Socket | null = null;
  private listeners: ((data: SubscriptionData) => void)[] = [];
  private isConnected = false;

  // Initialize socket connection
  public initialize() {
    const token = localStorage.getItem("token");
    if (!token || this.isConnected) return;

    try {
      this.socket = io("http://localhost:5000", {
        auth: { token }
      });

      // Get user ID from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      this.socket.on("connect", () => {
        console.log("Subscription service connected");
        this.isConnected = true;
        this.socket?.emit("join-user-room", userId);
      });

      this.socket.on("disconnect", () => {
        console.log("Subscription service disconnected");
        this.isConnected = false;
      });

      // Listen for subscription updates
      this.socket.on("subscription-updated", (data: SubscriptionUpdateData) => {
        console.log("Subscription updated via socket:", data);
        
        // Show success message
        toast.success(data.message);
        
        // Refresh subscription data and notify listeners
        this.refreshSubscriptionData();
      });

      // Listen for payment failures
      this.socket.on("payment-failed", (data: { message: string; paymentMethod?: string }) => {
        console.log("Payment failed via socket:", data);
        toast.error(data.message);
      });

    } catch (error) {
      console.error("Error initializing subscription service:", error);
    }
  }

  // Add listener for subscription updates
  public addListener(callback: (data: SubscriptionData) => void) {
    this.listeners.push(callback);
  }

  // Remove listener
  public removeListener(callback: (data: SubscriptionData) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Refresh subscription data and notify all listeners
  public async refreshSubscriptionData() {
    try {
      const response = await axiosInstance.get("/auth/quota");
      const data: SubscriptionData = response.data;
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(data));
      
      return data;
    } catch (error) {
      console.error("Failed to refresh subscription data:", error);
      return null;
    }
  }

  // Get current subscription data
  public async getSubscriptionData(): Promise<SubscriptionData | null> {
    try {
      const response = await axiosInstance.get("/auth/quota");
      return response.data;
    } catch (error) {
      console.error("Failed to get subscription data:", error);
      return null;
    }
  }

  // Disconnect socket
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.listeners = [];
  }

  // Check if service is connected
  public get connected() {
    return this.isConnected;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();

// Auto-initialize when token is available
if (localStorage.getItem("token")) {
  subscriptionService.initialize();
}

export default subscriptionService;