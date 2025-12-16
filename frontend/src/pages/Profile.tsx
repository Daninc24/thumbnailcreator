import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../api/user";
import { getSubscription } from "../api/subscription";
import type { Subscription } from "../api/subscription";
import { toast } from "../components/Toast";
import { useNavigate } from "react-router-dom";
import PricingPlans from "../components/PricingPlans";

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchSubscription();
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

  const fetchSubscription = async () => {
    try {
      const res = await getSubscription();
      setSubscription(res.subscription);
    } catch (err: any) {
      console.error("Failed to load subscription:", err);
    }
  };

  const handleSubscriptionSuccess = async () => {
    await fetchSubscription();
    await fetchProfile();
    setShowPricing(false);
    toast.success("Subscription updated successfully!");
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
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your account and subscription</p>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <div className="bg-slate-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Subscription Plan</h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Current Plan:</span>
                <span className="text-xl font-bold capitalize">{subscription.plan}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Monthly Quota:</span>
                <span className="font-semibold">
                  {subscription.used} / {subscription.quota} images
                </span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${
                    subscription.remaining > subscription.quota * 0.2
                      ? "bg-green-500"
                      : subscription.remaining > 0
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${(subscription.used / subscription.quota) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{subscription.remaining} remaining</span>
                {subscription.expiresAt && (
                  <span>
                    Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowPricing(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Upgrade Plan</span>
              </button>
              
              <button
                onClick={() => navigate("/payments")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Payment History</span>
              </button>
            </div>
          </div>
        )}

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

        {/* Pricing Plans Modal */}
        {showPricing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
                <button
                  onClick={() => setShowPricing(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <PricingPlans
                  currentPlan={subscription?.plan}
                  onSubscriptionSuccess={handleSubscriptionSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

