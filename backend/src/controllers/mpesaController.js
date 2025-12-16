import axios from "axios";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

// M-Pesa Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || "174379",
  passkey: process.env.MPESA_PASSKEY,
  callbackUrl: process.env.MPESA_CALLBACK_URL || "http://localhost:5000/api/payments/mpesa/callback",
  environment: process.env.MPESA_ENVIRONMENT || "sandbox", // sandbox or production
};

// M-Pesa API URLs
const MPESA_URLS = {
  sandbox: {
    auth: "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    stkPush: "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  },
  production: {
    auth: "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    stkPush: "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  },
};

const PLAN_PRICING_KES = {
  pro: 1000, // ~$10 USD
  premium: 2500, // ~$25 USD
};

const PLAN_QUOTAS = {
  free: 10,
  pro: 100,
  premium: 500,
};

// Get M-Pesa access token
const getMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(MPESA_URLS[MPESA_CONFIG.environment].auth, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error("M-Pesa auth error:", error.response?.data || error.message);
    throw new Error("Failed to get M-Pesa access token");
  }
};

// Generate timestamp for M-Pesa
const generateTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
};

// Generate M-Pesa password
const generatePassword = (timestamp) => {
  const data = MPESA_CONFIG.businessShortCode + MPESA_CONFIG.passkey + timestamp;
  return Buffer.from(data).toString('base64');
};

// Initiate M-Pesa STK Push
export const initiateMpesaPayment = async (req, res) => {
  try {
    const { phoneNumber, plan, amount } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate inputs
    if (!phoneNumber || !plan || !amount) {
      return res.status(400).json({ message: "Phone number, plan, and amount are required" });
    }

    if (!["pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    // Validate amount matches plan pricing
    if (amount !== PLAN_PRICING_KES[plan]) {
      return res.status(400).json({ message: "Invalid amount for selected plan" });
    }

    // Format phone number (remove + and ensure it starts with 254)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
      // Already formatted
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    } else {
      return res.status(400).json({ message: "Invalid phone number format. Use format: 0712345678 or +254712345678" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get M-Pesa access token
    const accessToken = await getMpesaAccessToken();
    
    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    
    // Create unique transaction reference
    const transactionRef = `TG_${Date.now()}_${userId.toString().slice(-6)}`;

    // STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: MPESA_CONFIG.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: transactionRef,
      TransactionDesc: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription - Thumbnail Generator`,
    };

    // Send STK Push request
    const response = await axios.post(
      MPESA_URLS[MPESA_CONFIG.environment].stkPush,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.ResponseCode === "0") {
      // Create pending payment record
      const payment = new Payment({
        userId,
        mpesaCheckoutRequestId: response.data.CheckoutRequestID,
        amount,
        currency: "KES",
        plan,
        status: "pending",
        paymentMethod: "mpesa",
        metadata: {
          phoneNumber: formattedPhone,
          transactionRef,
          merchantRequestId: response.data.MerchantRequestID,
        },
      });
      await payment.save();

      res.json({
        success: true,
        message: "STK Push sent successfully. Please complete payment on your phone.",
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        transactionRef,
      });
    } else {
      throw new Error(response.data.ResponseDescription || "STK Push failed");
    }
  } catch (error) {
    console.error("M-Pesa STK Push error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: error.message || "Failed to initiate M-Pesa payment",
      error: error.response?.data || error.message 
    });
  }
};

// M-Pesa callback handler
export const handleMpesaCallback = async (req, res) => {
  try {
    console.log("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));

    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find the payment record
    const payment = await Payment.findOne({ mpesaCheckoutRequestId: CheckoutRequestID });
    if (!payment) {
      console.error("Payment not found for CheckoutRequestID:", CheckoutRequestID);
      return res.status(404).json({ message: "Payment not found" });
    }

    if (ResultCode === 0) {
      // Payment successful
      let mpesaReceiptNumber = null;
      let transactionDate = null;
      let phoneNumber = null;

      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          switch (item.Name) {
            case "MpesaReceiptNumber":
              mpesaReceiptNumber = item.Value;
              break;
            case "TransactionDate":
              transactionDate = item.Value;
              break;
            case "PhoneNumber":
              phoneNumber = item.Value;
              break;
          }
        });
      }

      // Update payment status
      payment.status = "completed";
      payment.mpesaReceiptNumber = mpesaReceiptNumber;
      payment.metadata = {
        ...payment.metadata,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        resultDesc: ResultDesc,
      };
      await payment.save();

      // Update user subscription automatically
      const user = await User.findById(payment.userId);
      if (user) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        if (!user.subscription) {
          user.subscription = {};
        }

        user.subscription.plan = payment.plan;
        user.subscription.quota = PLAN_QUOTAS[payment.plan];
        user.subscription.used = 0; // Reset usage on upgrade
        user.subscription.expiresAt = expiresAt;
        user.subscription.resetAt = expiresAt;
        user.subscription.paymentId = payment._id;

        await user.save();

        console.log(`M-Pesa subscription automatically updated for user ${user._id}: ${payment.plan} plan`);
        
        // Emit real-time notification if socket.io is available
        const io = global.io;
        if (io) {
          io.to(`user-${user._id}`).emit("subscription-updated", {
            plan: payment.plan,
            quota: PLAN_QUOTAS[payment.plan],
            used: 0,
            expiresAt,
            paymentMethod: "mpesa",
            receiptNumber: mpesaReceiptNumber,
            message: `Successfully upgraded to ${payment.plan} plan via M-Pesa!`
          });
        }
      }

      console.log("M-Pesa payment successful:", mpesaReceiptNumber);
    } else {
      // Payment failed
      payment.status = "failed";
      payment.metadata = {
        ...payment.metadata,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      };
      await payment.save();

      console.log("M-Pesa payment failed:", ResultDesc);
      
      // Emit real-time notification for failed payment
      const io = global.io;
      if (io) {
        io.to(`user-${payment.userId}`).emit("payment-failed", {
          message: `M-Pesa payment failed: ${ResultDesc}`,
          paymentMethod: "mpesa",
          checkoutRequestId: CheckoutRequestID
        });
      }
    }

    // Always respond with success to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal server error" });
  }
};

// Check M-Pesa payment status
export const checkMpesaPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;
    const userId = req.user._id || req.user.id;

    const payment = await Payment.findOne({ 
      mpesaCheckoutRequestId: checkoutRequestId,
      userId 
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({
      status: payment.status,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      metadata: payment.metadata,
    });
  } catch (error) {
    console.error("Check M-Pesa status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get M-Pesa pricing for different plans
export const getMpesaPricing = async (req, res) => {
  try {
    const plans = [
      {
        name: "pro",
        price: PLAN_PRICING_KES.pro,
        currency: "KES",
        quota: PLAN_QUOTAS.pro,
        features: [
          "100 images per month",
          "All premium templates",
          "Advanced customization",
          "Background removal",
          "Priority support",
          "Bulk processing",
        ],
        popular: true,
      },
      {
        name: "premium",
        price: PLAN_PRICING_KES.premium,
        currency: "KES",
        quota: PLAN_QUOTAS.premium,
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
      },
    ];

    res.json({ plans });
  } catch (error) {
    console.error("Get M-Pesa pricing error:", error);
    res.status(500).json({ message: error.message });
  }
};