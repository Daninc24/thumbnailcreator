import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers, updateUserPlan, updateUserRole, deleteUser, resetUserQuota } from "../api/admin";
import type { AdminUser } from "../api/admin";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";
import AdminDashboard from "../components/AdminDashboard";
import AdminUserCard from "../components/AdminUserCard";

const AdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [sortBy, setSortBy] = useState<"email" | "createdAt" | "totalImages" | "usage">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"dashboard" | "table" | "cards">("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.users);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
      } else {
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (userId: string, plan: string) => {
    try {
      await updateUserPlan(userId, plan);
      toast.success(`User plan updated to ${plan}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update plan");
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      toast.success(`User role updated to ${role}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleResetQuota = async (userId: string) => {
    try {
      await resetUserQuota(userId);
      toast.success("User quota reset successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset quota");
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesPlan = filterPlan === "all" || user.subscription.plan === filterPlan;
      return matchesSearch && matchesRole && matchesPlan;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "email":
          aValue = a.email;
          bValue = b.email;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "totalImages":
          aValue = a.totalImages;
          bValue = b.totalImages;
          break;
        case "usage":
          aValue = a.subscription.used / a.subscription.quota;
          bValue = b.subscription.used / b.subscription.quota;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkAction = async (action: "delete" | "resetQuota") => {
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    const confirmMessage = action === "delete" 
      ? `Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`
      : `Are you sure you want to reset quota for ${selectedUsers.length} users?`;

    if (!confirm(confirmMessage)) return;

    try {
      for (const userId of selectedUsers) {
        if (action === "delete") {
          await deleteUser(userId);
        } else if (action === "resetQuota") {
          await resetUserQuota(userId);
        }
      }
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(`Bulk ${action} failed: ${err?.response?.data?.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-400 mt-2">Manage users, subscriptions, and system analytics</p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard View */}
        {viewMode === "dashboard" && (
          <AdminDashboard users={users} />
        )}

        {/* Table/Cards View */}
        {viewMode !== "dashboard" && (
          <div>
            {/* Filters and Search */}
            <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Filter & Search Users</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                </select>
                
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="email">Sort by Email</option>
                  <option value="totalImages">Sort by Images</option>
                  <option value="usage">Sort by Usage</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  Bulk Actions ({selectedUsers.length} selected)
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleBulkAction("resetQuota")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Reset Quotas
                  </button>
                  
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Delete Users
                  </button>
                  
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Cards View */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <AdminUserCard
                    key={user.id}
                    user={user}
                    onUpdateRole={handleUpdateRole}
                    onUpdatePlan={handleUpdatePlan}
                    onResetQuota={handleResetQuota}
                    onDelete={handleDeleteUser}
                    isSelected={selectedUsers.includes(user.id)}
                    onToggleSelect={toggleUserSelection}
                  />
                ))}
                {filteredUsers.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <h3 className="text-lg font-medium text-gray-300 mt-4">No users found</h3>
                    <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                  <h2 className="text-xl font-semibold">Users ({filteredUsers.length})</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={selectAllUsers}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Plan</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Usage</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Images</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-750 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={user.subscription.plan}
                              onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                              className="bg-slate-700 text-white px-2 py-1 rounded text-sm"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">
                              {user.subscription.used} / {user.subscription.quota}
                            </div>
                            <button
                              onClick={() => handleResetQuota(user.id)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded mt-1"
                            >
                              Reset
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">{user.totalImages}</div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-300 mt-4">No users found</h3>
                      <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;