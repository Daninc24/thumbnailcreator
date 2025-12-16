import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getProfile } from "../api/user";
import { getSubscription } from "../api/subscription";
// import QuotaDisplay from "./QuotaDisplay"; // Unused import
import type { Subscription } from "../api/subscription";

interface UserProfile {
  email: string;
  role?: string;
}

const Navbar = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const [profileRes, subRes] = await Promise.all([
        getProfile(),
        getSubscription()
      ]);
      setUser(profileRes.user);
      setSubscription(subRes.subscription);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">ThumbnailGen</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/analytics"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/analytics")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              Analytics
            </Link>
            {user.role === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/admin")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                Admin
              </Link>
            )}
            
            
            
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-3 text-gray-300 hover:text-white focus:outline-none"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">{user.email}</span>
                {subscription && (
                  <span className="text-xs text-gray-400 capitalize">
                    {subscription.plan} • {subscription.remaining} left
                  </span>
                )}
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg py-1 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-700">
              <Link
                to="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/dashboard")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-slate-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/analytics")
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-slate-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Analytics
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/admin")
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-slate-700"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;