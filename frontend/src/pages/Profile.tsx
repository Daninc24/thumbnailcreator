import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../api/user";
import { toast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

type UserProfile = {
  id: string;
  email: string;
  createdAt: string;
  stats: {
    totalImages: number;
    processedImages: number;
    thumbnailsCreated: number;
    credits: number;
  };
};

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.user);
      setEmail(res.user.email);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setUpdatingEmail(true);
    try {
      const res = await updateProfile(email);
      setProfile({ ...profile!, email: res.user.email });
      toast.success("Email updated successfully");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to update email";
      toast.error(errorMsg);
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to change password";
      toast.error(errorMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-400 hover:text-blue-300 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>

        {/* Statistics */}
        {profile && (
          <div className="bg-slate-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Total Images</p>
                <p className="text-2xl font-bold">{profile.stats.totalImages}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Processed</p>
                <p className="text-2xl font-bold">{profile.stats.processedImages}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Thumbnails</p>
                <p className="text-2xl font-bold">{profile.stats.thumbnailsCreated}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Credits</p>
                <p className="text-2xl font-bold">{profile.stats.credits}</p>
              </div>
            </div>
          </div>
        )}

        {/* Update Email */}
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Update Email</h2>
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 p-2 rounded w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={updatingEmail}
              className="bg-blue-600 py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {updatingEmail ? "Updating..." : "Update Email"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-700 p-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-700 p-2 rounded w-full"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 p-2 rounded w-full"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-green-600 py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

