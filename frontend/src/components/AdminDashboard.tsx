import React from "react";
import type { AdminUser } from "../api/admin";

interface AdminDashboardProps {
  users: AdminUser[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users }) => {
  // Calculate comprehensive statistics
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === "admin").length,
    activeUsers: users.filter(u => u.totalImages > 0).length,
    
    // Plan distribution
    freeUsers: users.filter(u => u.subscription.plan === "free").length,
    proUsers: users.filter(u => u.subscription.plan === "pro").length,
    premiumUsers: users.filter(u => u.subscription.plan === "premium").length,
    
    // Usage statistics
    totalImages: users.reduce((sum, u) => sum + u.totalImages, 0),
    totalQuotaUsed: users.reduce((sum, u) => sum + u.subscription.used, 0),
    totalQuotaAvailable: users.reduce((sum, u) => sum + u.subscription.quota, 0),
    
    // Advanced metrics
    averageImagesPerUser: users.length > 0 ? users.reduce((sum, u) => sum + u.totalImages, 0) / users.length : 0,
    averageUsagePercentage: users.length > 0 ? users.reduce((sum, u) => sum + (u.subscription.used / u.subscription.quota), 0) / users.length * 100 : 0,
    
    // High usage users (>80% quota used)
    highUsageUsers: users.filter(u => (u.subscription.used / u.subscription.quota) > 0.8).length,
    
    // Recent signups (last 7 days)
    recentSignups: users.filter(u => {
      const signupDate = new Date(u.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return signupDate > weekAgo;
    }).length,
  };

  const planDistribution = [
    { name: "Free", count: stats.freeUsers, color: "bg-gray-500", percentage: (stats.freeUsers / stats.totalUsers) * 100 },
    { name: "Pro", count: stats.proUsers, color: "bg-blue-500", percentage: (stats.proUsers / stats.totalUsers) * 100 },
    { name: "Premium", count: stats.premiumUsers, color: "bg-purple-500", percentage: (stats.premiumUsers / stats.totalUsers) * 100 },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{formatNumber(stats.totalUsers)}</div>
          <div className="text-xs text-gray-400">Total Users</div>
          <div className="text-xs text-green-400 mt-1">
            +{stats.recentSignups} this week
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{formatNumber(stats.activeUsers)}</div>
          <div className="text-xs text-gray-400">Active Users</div>
          <div className="text-xs text-blue-400 mt-1">
            {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% active
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{formatNumber(stats.totalImages)}</div>
          <div className="text-xs text-gray-400">Total Images</div>
          <div className="text-xs text-yellow-400 mt-1">
            {stats.averageImagesPerUser.toFixed(1)} avg/user
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.averageUsagePercentage.toFixed(1)}%</div>
          <div className="text-xs text-gray-400">Avg Usage</div>
          <div className="text-xs text-red-400 mt-1">
            {stats.highUsageUsers} high usage
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.adminUsers}</div>
          <div className="text-xs text-gray-400">Admins</div>
          <div className="text-xs text-gray-400 mt-1">
            {((stats.adminUsers / stats.totalUsers) * 100).toFixed(1)}% of users
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {((stats.totalQuotaUsed / stats.totalQuotaAvailable) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">System Usage</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatNumber(stats.totalQuotaUsed)}/{formatNumber(stats.totalQuotaAvailable)}
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Subscription Plan Distribution
        </h3>
        
        <div className="space-y-4">
          {planDistribution.map((plan) => (
            <div key={plan.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${plan.color}`}></div>
                <span className="text-white font-medium">{plan.name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-slate-600 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${plan.color}`}
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-400 w-16 text-right">
                  {plan.count} ({plan.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Usage Alerts */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Usage Alerts
          </h3>
          
          <div className="space-y-3">
            {stats.highUsageUsers > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-yellow-400">High Usage Users</div>
                  <div className="text-xs text-yellow-300">{stats.highUsageUsers} users above 80% quota</div>
                </div>
                <div className="text-yellow-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            )}
            
            {((stats.totalQuotaUsed / stats.totalQuotaAvailable) * 100) > 80 && (
              <div className="flex items-center justify-between p-3 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-red-400">System Capacity</div>
                  <div className="text-xs text-red-300">Overall system usage above 80%</div>
                </div>
                <div className="text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            )}
            
            {stats.recentSignups > 10 && (
              <div className="flex items-center justify-between p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-green-400">Growth Spike</div>
                  <div className="text-xs text-green-300">{stats.recentSignups} new users this week</div>
                </div>
                <div className="text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            )}
            
            {stats.highUsageUsers === 0 && ((stats.totalQuotaUsed / stats.totalQuotaAvailable) * 100) < 80 && stats.recentSignups <= 10 && (
              <div className="text-center py-4 text-gray-400">
                <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">All systems running smoothly</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span>Export User Data</span>
            </button>
            
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset All Quotas</span>
            </button>
            
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>System Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;