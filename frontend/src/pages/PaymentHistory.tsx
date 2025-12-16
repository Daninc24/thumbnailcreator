import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { toast } from "../components/Toast";
import LoadingSpinner from "../components/LoadingSpinner";

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  mpesaReceiptNumber?: string;
  metadata?: {
    customerEmail?: string;
    description?: string;
    phoneNumber?: string;
    transactionRef?: string;
    mpesaReceiptNumber?: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalPayments: number;
  hasMore: boolean;
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments(1);
  }, []);

  const fetchPayments = async (page: number) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/payments/history?page=${page}&limit=10`);
      setPayments(response.data.payments);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load payment history");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string, paymentMethod?: string) => {
    // M-Pesa amounts are already in the correct format (not in cents)
    const actualAmount = paymentMethod === "mpesa" ? amount : amount / 100;
    
    if (currency.toLowerCase() === "kes") {
      return `KES ${actualAmount.toLocaleString()}`;
    }
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(actualAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", text: "Completed" },
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      failed: { color: "bg-red-100 text-red-800", text: "Failed" },
      refunded: { color: "bg-gray-100 text-gray-800", text: "Refunded" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      pro: { color: "bg-blue-100 text-blue-800", text: "Pro" },
      premium: { color: "bg-purple-100 text-purple-800", text: "Premium" },
    };

    const config = planConfig[plan as keyof typeof planConfig] || { color: "bg-gray-100 text-gray-800", text: plan };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentMethodBadge = (paymentMethod?: string) => {
    if (paymentMethod === "mpesa") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          M-Pesa
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Card
      </span>
    );
  };

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading payment history..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Payment History
              </h1>
              <p className="text-gray-400 mt-2">View your subscription payments and transactions</p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Profile</span>
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 text-center">
            <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Payment History</h3>
            <p className="text-gray-400 mb-6">You haven't made any payments yet.</p>
            <button
              onClick={() => navigate("/profile")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Upgrade Your Plan
            </button>
          </div>
        ) : (
          <>
            {/* Payment Table */}
            <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Receipt/ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-slate-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPlanBadge(payment.plan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {formatAmount(payment.amount, payment.currency, payment.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentMethodBadge(payment.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {payment.paymentMethod === "mpesa" ? (
                            <div>
                              {payment.mpesaReceiptNumber || payment.metadata?.mpesaReceiptNumber ? (
                                <div className="font-mono text-xs">
                                  {payment.mpesaReceiptNumber || payment.metadata?.mpesaReceiptNumber}
                                </div>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                              {payment.metadata?.phoneNumber && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {payment.metadata.phoneNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs">
                              {payment.metadata?.description || `${payment.plan.charAt(0).toUpperCase() + payment.plan.slice(1)} Plan`}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => fetchPayments(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Page</span>
                  <span className="bg-slate-700 px-3 py-1 rounded-lg font-medium">
                    {pagination.currentPage}
                  </span>
                  <span className="text-sm text-gray-400">of {pagination.totalPages}</span>
                </div>
                
                <button
                  onClick={() => fetchPayments(currentPage + 1)}
                  disabled={!pagination.hasMore || loading}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;