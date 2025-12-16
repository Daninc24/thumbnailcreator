import Stripe from "stripe";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_your_key_here", {
  apiVersion: "2023-10-16",
});

// Subscription plan pricing (in cents)
const PLAN_PRICING = {
  pro: 999, // $9.99
  premium: 2499, // $24.99
};

const PLAN_QUOTAS = {
  free: 10,
  pro: 100,
  premium: 500,
};

// Create payment intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { plan, amount, currency = "usd", customer_info } = req.body;
    const userId = req.user._id || req.user.id;

    if (!plan || !["pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    // Validate amount matches plan pricing
    if (amount !== PLAN_PRICING[plan]) {
      return res.status(400).json({ message: "Invalid amount for selected plan" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create or retrieve Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: customer_info.email || user.email,
        name: customer_info.name,
        address: customer_info.address,
        metadata: {
          userId: userId.toString(),
        },
      });
      
      // Save customer ID to user
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customer.id,
      metadata: {
        userId: userId.toString(),
        plan,
      },
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      customer_id: customer.id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Confirm subscription after successful payment
export const confirmSubscription = async (req, res) => {
  try {
    const { payment_intent_id, plan } = req.body;
    const userId = req.user._id || req.user.id;

    if (!payment_intent_id || !plan) {
      return res.status(400).json({ message: "Missing payment intent ID or plan" });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // Verify the payment belongs to this user
    if (paymentIntent.metadata.userId !== userId.toString()) {
      return res.status(403).json({ message: "Payment verification failed" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create payment record
    const payment = new Payment({
      userId,
      stripePaymentIntentId: payment_intent_id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      plan,
      status: "completed",
      metadata: {
        customerEmail: paymentIntent.receipt_email,
      },
    });
    await payment.save();

    // Update user subscription
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (!user.subscription) {
      user.subscription = {};
    }

    user.subscription.plan = plan;
    user.subscription.quota = PLAN_QUOTAS[plan];
    user.subscription.used = 0; // Reset usage on upgrade
    user.subscription.expiresAt = expiresAt;
    user.subscription.resetAt = expiresAt;
    user.subscription.paymentId = payment._id;

    await user.save();

    res.json({
      message: `Successfully subscribed to ${plan} plan`,
      subscription: {
        plan: user.subscription.plan,
        quota: user.subscription.quota,
        used: user.subscription.used,
        expiresAt: user.subscription.expiresAt,
        remaining: user.subscription.quota - user.subscription.used,
      },
    });
  } catch (error) {
    console.error("Confirm subscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ userId });

    res.json({
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasMore: skip + payments.length < total,
      },
    });
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel subscription (downgrade to free)
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update subscription to free plan
    if (!user.subscription) {
      user.subscription = {};
    }

    user.subscription.plan = "free";
    user.subscription.quota = PLAN_QUOTAS.free;
    user.subscription.expiresAt = null;
    user.subscription.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();

    res.json({
      message: "Subscription cancelled successfully",
      subscription: {
        plan: user.subscription.plan,
        quota: user.subscription.quota,
        used: user.subscription.used,
        expiresAt: user.subscription.expiresAt,
        remaining: user.subscription.quota - user.subscription.used,
      },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Webhook handler for Stripe events
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("Payment succeeded:", paymentIntent.id);
      
      // Automatically update subscription when payment succeeds
      try {
        await handleSuccessfulStripePayment(paymentIntent);
      } catch (error) {
        console.error("Error handling successful payment:", error);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("Payment failed:", failedPayment.id);
      
      // Handle failed payment
      try {
        await handleFailedStripePayment(failedPayment);
      } catch (error) {
        console.error("Error handling failed payment:", error);
      }
      break;

    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object;
      console.log("Subscription cancelled:", deletedSubscription.id);
      // Handle subscription cancellation
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Handle successful Stripe payment automatically
const handleSuccessfulStripePayment = async (paymentIntent) => {
  try {
    const userId = paymentIntent.metadata.userId;
    const plan = paymentIntent.metadata.plan;

    if (!userId || !plan) {
      console.error("Missing userId or plan in payment intent metadata");
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for payment:", userId);
      return;
    }

    // Check if payment record already exists
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    
    if (!payment) {
      // Create payment record
      payment = new Payment({
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        plan,
        status: "completed",
        paymentMethod: "stripe",
        metadata: {
          customerEmail: paymentIntent.receipt_email,
          description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        },
      });
      await payment.save();
    } else {
      // Update existing payment record
      payment.status = "completed";
      await payment.save();
    }

    // Update user subscription automatically
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (!user.subscription) {
      user.subscription = {};
    }

    user.subscription.plan = plan;
    user.subscription.quota = PLAN_QUOTAS[plan];
    user.subscription.used = 0; // Reset usage on upgrade
    user.subscription.expiresAt = expiresAt;
    user.subscription.resetAt = expiresAt;
    user.subscription.paymentId = payment._id;

    await user.save();

    console.log(`Subscription automatically updated for user ${userId}: ${plan} plan`);
    
    // Emit real-time notification if socket.io is available
    const io = global.io;
    if (io) {
      io.to(`user-${userId}`).emit("subscription-updated", {
        plan,
        quota: PLAN_QUOTAS[plan],
        used: 0,
        expiresAt,
        message: `Successfully upgraded to ${plan} plan!`
      });
    }

  } catch (error) {
    console.error("Error in handleSuccessfulStripePayment:", error);
  }
};

// Handle failed Stripe payment
const handleFailedStripePayment = async (paymentIntent) => {
  try {
    const userId = paymentIntent.metadata.userId;
    const plan = paymentIntent.metadata.plan;

    if (!userId) {
      console.error("Missing userId in failed payment intent metadata");
      return;
    }

    // Update or create payment record as failed
    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
    
    if (!payment) {
      payment = new Payment({
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        plan: plan || "unknown",
        status: "failed",
        paymentMethod: "stripe",
        metadata: {
          failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
        },
      });
    } else {
      payment.status = "failed";
      payment.metadata = {
        ...payment.metadata,
        failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
      };
    }
    
    await payment.save();

    console.log(`Payment failed for user ${userId}: ${paymentIntent.id}`);
    
    // Emit real-time notification if socket.io is available
    const io = global.io;
    if (io) {
      io.to(`user-${userId}`).emit("payment-failed", {
        message: "Payment failed. Please try again or contact support.",
        paymentId: paymentIntent.id
      });
    }

  } catch (error) {
    console.error("Error in handleFailedStripePayment:", error);
  }
};

// Get subscription plans and pricing
export const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        name: "free",
        price: 0,
        quota: PLAN_QUOTAS.free,
        features: [
          "10 images per month",
          "Basic thumbnail templates",
          "Background removal",
          "Standard support",
        ],
      },
      {
        name: "pro",
        price: PLAN_PRICING.pro / 100, // Convert cents to dollars
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
        price: PLAN_PRICING.premium / 100, // Convert cents to dollars
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
    console.error("Get plans error:", error);
    res.status(500).json({ message: error.message });
  }
};