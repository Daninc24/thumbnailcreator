import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import subscriptionService from "../services/subscriptionService";

interface QuotaData {
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

interface QuotaDisplayProps {
  className?: string;
  showDetails?: boolean;
  onQuotaUpdate?: (quota: QuotaData) => void;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ 
  className = "", 
  showDetails = true,
  onQuotaUpdate 
}) => {
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotaStatus = async () => {
    try {
      const response = await axiosInstance.get("/auth/quota");
      setQuotaData(response.data);
      if (onQuotaUpdate) {
        onQuotaUpdate(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch quota status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize subscription service
    subscriptionService.initialize();
    
    // Fetch initial quota status
    fetchQuotaStatus();
    
    // Listen for subscription updates via the service
    const handleSubscriptionUpdate = (data: QuotaData) => {
      setQuotaData(data);
      if (onQuotaUpdate) {
        onQuotaUpdate(data);
      }
    };

    subscriptionService.addListener(handleSubscriptionUpdate);
    
    // Refresh quota every 30 seconds as fallback
    const interval = setInterval(fetchQuotaStatus, 30000);
    
    return () => {
      subscriptionService.removeListener(handleSubscriptionUpdate);
      clearInterval(interval);
    };
  }, [onQuotaUpdate]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-slate-700 h-4 rounded mb-2"></div>
        <div className="bg-slate-700 h-2 rounded"></div>
      </div>
    );
  }

  if (!quotaData) {
    return null;
  }

  // Don't show quota for admins
  if (quotaData.isAdmin) {
    return (
      <div className={`bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-white font-semibold">Admin - Unlimited</span>
        </div>
      </div>
    );
  }

  const { quota, plan } = quotaData;
  const isNearLimit = quota.percentage >= 80;
  const isAtLimit = quota.remaining === 0;

  const getProgressColor = () => {
    if (isAtLimit) return "bg-red-500";
    if (isNearLimit) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPlanColor = () => {
    switch (plan) {
      case "pro": return "text-blue-400";
      case "premium": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-white font-medium">Usage</span>
        </div>
        <span className={`text-sm font-semibold capitalize ${getPlanColor()}`}>
          {plan}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">
            {quota.used} / {quota.limit} images
          </span>
          <span className={`font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-green-400"}`}>
            {quota.remaining} remaining
          </span>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(quota.percentage, 100)}%` }}
          ></div>
        </div>

        {showDetails && (
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>
              Resets: {quotaData.resetAt ? formatDate(quotaData.resetAt) : "N/A"}
            </span>
            {quota.percentage >= 90 && (
              <span className="text-yellow-400 font-medium">
                ⚠️ Almost full
              </span>
            )}
            {isAtLimit && (
              <span className="text-red-400 font-medium">
                🚫 Limit reached
              </span>
            )}
          </div>
        )}
      </div>

      {isAtLimit && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Quota exceeded. Upgrade your plan to continue.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;