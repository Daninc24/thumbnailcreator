import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalytics, exportReport } from "../api/analytics";
import { toast } from "../components/Toast";

type Analytics = {
  totalImages: number;
  bgRemoved: number;
  thumbnails: number;
  pending: number;
  lastUpload: string | null;
  totalProcessed: number;
  dailyStats: {
    date: string;
    uploaded: number;
    bgRemoved: number;
    thumbnails: number;
  }[];
  weeklyStats: {
    week: string;
    date: string;
    uploaded: number;
    bgRemoved: number;
    thumbnails: number;
  }[];
};
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"daily" | "weekly">("daily");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getAnalytics();
      setAnalytics(res.analytics);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportReport();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-report-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (err: any) {
      toast.error("Failed to export report");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="text-center py-12">
          <p className="text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  const chartData = chartType === "daily" ? analytics.dailyStats : analytics.weeklyStats;
  const xAxisKey = chartType === "daily" ? "date" : "week";

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Track your image processing activity and performance</p>
          </div>
          <button
            onClick={handleExport}
            className="bg-blue-600 py-2 px-4 rounded hover:bg-blue-700"
          >
            Export CSV Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Images</p>
            <h2 className="text-3xl font-bold text-blue-400">{analytics.totalImages}</h2>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">BG Removed</p>
            <h2 className="text-3xl font-bold text-purple-400">{analytics.bgRemoved}</h2>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Thumbnails</p>
            <h2 className="text-3xl font-bold text-green-400">{analytics.thumbnails}</h2>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Pending</p>
            <h2 className="text-3xl font-bold text-yellow-400">{analytics.pending}</h2>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Processed</p>
            <h2 className="text-2xl font-bold">{analytics.totalProcessed}</h2>
            <p className="text-xs text-gray-500 mt-2">
              {analytics.totalImages > 0
                ? Math.round((analytics.totalProcessed / analytics.totalImages) * 100)
                : 0}
              % of images processed
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Last Upload</p>
            <h2 className="text-lg font-semibold">
              {analytics.lastUpload
                ? new Date(analytics.lastUpload).toLocaleDateString()
                : "No uploads yet"}
            </h2>
            {analytics.lastUpload && (
              <p className="text-xs text-gray-500 mt-2">
                {new Date(analytics.lastUpload).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="bg-slate-800 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Activity Trends</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType("daily")}
                className={`px-4 py-2 rounded ${
                  chartType === "daily"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartType("weekly")}
                className={`px-4 py-2 rounded ${
                  chartType === "weekly"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Line Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Uploads & Processing Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="uploaded"
                  stroke="#3b82f6"
                  name="Uploaded"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="bgRemoved"
                  stroke="#a855f7"
                  name="BG Removed"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="thumbnails"
                  stroke="#10b981"
                  name="Thumbnails"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div>
            <h3 className="text-lg font-medium mb-2">Activity Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="uploaded" fill="#3b82f6" name="Uploaded" />
                <Bar dataKey="bgRemoved" fill="#a855f7" name="BG Removed" />
                <Bar dataKey="thumbnails" fill="#10b981" name="Thumbnails" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

