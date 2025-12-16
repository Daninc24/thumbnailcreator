import React, { useState } from "react";
import type { AdminUser } from "../api/admin";


interface AdminUserCardProps {
  user: AdminUser;
  onUpdateRole: (userId: string, role: string) => void;
  onUpdatePlan: (userId: string, plan: string) => void;
  onResetQuota: (userId: string) => void;
  onDelete: (userId: string, email: string) => void;
  isSelected: boolean;
  onToggleSelect: (userId: string) => void;
}

const AdminUserCard: React.FC<AdminUserCardProps> = ({
  user,
  onUpdateRole,
  onUpdatePlan,
  onResetQuota,
  onDelete,
  isSelected,
  onToggleSelect,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getUsagePercentage = () => {
    return Math.min((user.subscription.used / user.subscription.quota) * 100, 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPlanColor = () => {
    switch (user.subscription.plan) {
      case "free": return "bg-gray-600";
      case "pro": return "bg-blue-600";
      case "premium": return "bg-purple-600";
      default: return "bg-gray-600";
    }
  };

  const getRoleColor = () => {
    return user.role === "admin" ? "bg-red-600" : "bg-green-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className={`bg-slate-800 rounded-xl shadow-lg transition-all duration-200 ${
      isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : ""
    }`}>
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(user.id)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{user.email}</h3>
              <p className="text-xs text-gray-400">ID: {user.id.slice(-8)}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${showDetails ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getRoleColor()}`}>
            {user.role}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPlanColor()}`}>
            {user.subscription.plan}
          </span>
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Quota Usage</span>
            <span className="text-sm font-medium text-white">
              {user.subscription.used} / {user.subscription.quota}
            </span>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor()}`}
              style={{ width: `${getUsagePercentage()}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {getUsagePercentage().toFixed(1)}% used
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-400">{user.totalImages}</div>
            <div className="text-xs text-gray-400">Total Images</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-400">
              {user.subscription.quota - user.subscription.used}
            </div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-slate-700 p-6 space-y-4">
          {/* Account Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Account Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Joined:</span>
                <span className="text-white">{formatDate(user.createdAt)}</span>
              </div>
              {user.subscription.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan Expires:</span>
                  <span className="text-white">{formatDate(user.subscription.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Admin Controls</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Role Selector */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Role</label>
                <select
                  value={user.role}
                  onChange={(e) => onUpdateRole(user.id, e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Plan Selector */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Plan</label>
                <select
                  value={user.subscription.plan}
                  onChange={(e) => onUpdatePlan(user.id, e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => onResetQuota(user.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset Quota</span>
            </button>
            
            <button
              onClick={() => onDelete(user.id, user.email)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete User</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserCard;