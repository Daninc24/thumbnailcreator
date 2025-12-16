import React, { useState } from "react";
import { toast } from "./Toast";
import axiosInstance from "../api/axiosInstance";

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: number;
    quota: number;
    features: string[];
    currency?: string;
  };
  onSuccess: () => void;
}

const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, "");
    
    // Format as XXX XXX XXX for display
    if (cleaned.length >= 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    // Kenyan phone numbers: 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 0)
    // Or international format: 2547XXXXXXXX or 2541XXXXXXXX
    return /^(0[17]\d{8}|254[17]\d{8})$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid Kenyan phone number (e.g., 0712345678)");
      return;
    }

    setProcessing(true);

    try {
      const response = await axiosInstance.post("/payments/mpesa/initiate", {
        phoneNumber: phoneNumber.replace(/\D/g, ""), // Send clean number
        plan: plan.name.toLowerCase(),
        amount: plan.price,
      });

      if (response.data.success) {
        setCheckoutRequestId(response.data.checkoutRequestId);
        setPaymentStatus("pending");
        toast.success("STK Push sent! Please check your phone and enter your M-Pesa PIN.");
        
        // Start polling for payment status
        pollPaymentStatus(response.data.checkoutRequestId);
      }
    } catch (error: any) {
      console.error("M-Pesa payment error:", error);
      toast.error(error?.response?.data?.message || "Failed to initiate M-Pesa payment");
    } finally {
      setProcessing(false);
    }
  };

  const pollPaymentStatus = async (requestId: string) => {
    const maxAttempts = 30; // Poll for 5 minutes (30 * 10 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await axiosInstance.get(`/payments/mpesa/status/${requestId}`);
        const status = response.data.status;
        
        setPaymentStatus(status);

        if (status === "completed") {
          toast.success("Payment successful! Your subscription has been activated and quota updated.");
          setPaymentStatus("completed");
          
          // Wait a moment for the backend to process, then trigger success
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
          return;
        } else if (status === "failed") {
          toast.error("Payment failed. Please try again.");
          setPaymentStatus("failed");
          return;
        } else if (status === "pending" && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else if (attempts >= maxAttempts) {
          toast.error("Payment timeout. Please check your M-Pesa messages or try again.");
          setPaymentStatus("timeout");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 10000);
        }
      }
    };

    poll();
  };

  const resetModal = () => {
    setPhoneNumber("");
    setProcessing(false);
    setCheckoutRequestId(null);
    setPaymentStatus(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Pay with M-Pesa
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {!checkoutRequestId ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Summary */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">{plan.name} Plan (Monthly)</span>
                    <span className="text-white font-semibold">
                      KES {plan.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{plan.quota} images per month</span>
                  </div>
                  <hr className="border-slate-600 my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-white">KES {plan.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-Pesa Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="0712345678"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter your Safaricom number (e.g., 0712345678)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Sending STK Push...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18l9-9-9-9-9 9 9 9z" />
                    </svg>
                    <span>Pay KES {plan.price.toLocaleString()}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                You will receive an STK Push on your phone. Enter your M-Pesa PIN to complete the payment.
              </p>
            </form>
          ) : (
            /* Payment Status */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                {paymentStatus === "pending" && (
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
                )}
                {paymentStatus === "completed" && (
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {(paymentStatus === "failed" || paymentStatus === "timeout") && (
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {paymentStatus === "pending" && "Waiting for Payment"}
                  {paymentStatus === "completed" && "Payment Successful!"}
                  {paymentStatus === "failed" && "Payment Failed"}
                  {paymentStatus === "timeout" && "Payment Timeout"}
                </h3>
                <p className="text-gray-400">
                  {paymentStatus === "pending" && "Please complete the payment on your phone using your M-Pesa PIN."}
                  {paymentStatus === "completed" && "Your subscription has been activated successfully."}
                  {paymentStatus === "failed" && "The payment was not completed. Please try again."}
                  {paymentStatus === "timeout" && "Payment took too long. Check your M-Pesa messages or try again."}
                </p>
              </div>

              {(paymentStatus === "failed" || paymentStatus === "timeout") && (
                <button
                  onClick={() => {
                    setCheckoutRequestId(null);
                    setPaymentStatus(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MpesaPaymentModal;