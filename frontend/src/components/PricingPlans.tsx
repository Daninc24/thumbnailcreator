import React, { useState } from "react";
import PaymentModal from "./PaymentModal";
import MpesaPaymentModal from "./MpesaPaymentModal";

interface Plan {
  name: string;
  price: number;
  quota: number;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface PricingPlansProps {
  currentPlan?: string;
  onSubscriptionSuccess: () => void;
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  currentPlan = "free",
  onSubscriptionSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "mpesa">("stripe");

  const plans: Plan[] = [
    {
      name: "Free",
      price: 0,
      quota: 10,
      features: [
        "10 images per month",
        "Basic thumbnail templates",
        "Background removal",
        "Standard support",
      ],
      current: currentPlan === "free",
    },
    {
      name: "Pro",
      price: 9.99,
      quota: 100,
      features: [
        "100 images per month",
        "All premium templates",
        "Advanced customization",
        "Background removal",
        "Priority support",
        "Bulk processing",
      ],
      popular: true,
      current: currentPlan === "pro",
    },
    {
      name: "Premium",
      price: 24.99,
      quota: 500,
      features: [
        "500 images per month",
        "All premium templates",
        "Advanced customization",
        "Background removal",
        "Priority support",
        "Bulk processing",
        "API access",
        "Custom branding",
      ],
      current: currentPlan === "premium",
    },
  ];

  // M-Pesa pricing (in KES)
  const mpesaPlans = {
    pro: { ...plans[1], price: 1000, currency: "KES" },
    premium: { ...plans[2], price: 2500, currency: "KES" },
  };

  const handleSelectPlan = (plan: Plan, method: "stripe" | "mpesa" = "stripe") => {
    if (plan.name === "Free") {
      // Handle free plan directly without payment
      handleFreePlan();
    } else {
      setSelectedPlan(plan);
      setPaymentMethod(method);
      if (method === "mpesa") {
        setShowMpesaModal(true);
      } else {
        setShowPaymentModal(true);
      }
    }
  };

  const handleFreePlan = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ plan: "free" }),
      });

      if (response.ok) {
        onSubscriptionSuccess();
      }
    } catch (error) {
      console.error("Failed to switch to free plan:", error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowMpesaModal(false);
    setSelectedPlan(null);
    onSubscriptionSuccess();
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-slate-800 rounded-xl p-6 border-2 transition-all duration-200 ${
              plan.popular
                ? "border-blue-500 shadow-lg shadow-blue-500/20"
                : plan.current
                ? "border-green-500"
                : "border-slate-700 hover:border-slate-600"
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            {/* Current Plan Badge */}
            {plan.current && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Current
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.price > 0 && (
                  <span className="text-gray-400 text-lg">/month</span>
                )}
              </div>
              <p className="text-gray-400">
                {plan.quota} images per month
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.name === "Free" || plan.current ? (
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={plan.current}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  plan.current
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                }`}
              >
                {plan.current
                  ? "Current Plan"
                  : "Downgrade to Free"}
              </button>
            ) : (
              <div className="space-y-2">
                {/* Stripe Payment Button */}
                <button
                  onClick={() => handleSelectPlan(plan, "stripe")}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 17.625V6.375zM21 9.375A.375.375 0 0020.625 9H3.375a.375.375 0 00-.375.375v8.25c0 .621.504 1.125 1.125 1.125h15.75c.621 0 1.125-.504 1.125-1.125V9.375z" />
                    </svg>
                    <span>Pay ${plan.price} with Card</span>
                  </div>
                </button>

                {/* M-Pesa Payment Button */}
                <button
                  onClick={() => handleSelectPlan(
                    plan.name === "Pro" ? mpesaPlans.pro : mpesaPlans.premium, 
                    "mpesa"
                  )}
                  className="w-full py-2 px-6 rounded-lg font-semibold transition-all duration-200 bg-green-600 hover:bg-green-700 text-white"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>
                      Pay KES {plan.name === "Pro" ? "1,000" : "2,500"} with M-Pesa
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stripe Payment Modal */}
      {selectedPlan && paymentMethod === "stripe" && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* M-Pesa Payment Modal */}
      {selectedPlan && paymentMethod === "mpesa" && (
        <MpesaPaymentModal
          isOpen={showMpesaModal}
          onClose={() => {
            setShowMpesaModal(false);
            setSelectedPlan(null);
          }}
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PricingPlans;