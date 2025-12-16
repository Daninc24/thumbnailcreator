# M-Pesa Payment Integration Setup Guide

This guide will help you set up M-Pesa payments using the Safaricom Daraja API for your Thumbnail Generator application.

## Prerequisites

1. **Safaricom Developer Account**: Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. **M-Pesa Business Account**: You need a registered business with Safaricom
3. **Node.js Application**: Your backend should be running

## Step 1: Create Daraja API App

1. Log in to the Safaricom Developer Portal
2. Go to "My Apps" and click "Create App"
3. Fill in the required details:
   - **App Name**: Your app name (e.g., "Thumbnail Generator")
   - **Description**: Brief description of your app
4. Select the following APIs:
   - **M-Pesa Express (STK Push)**: For initiating payments
   - **M-Pesa Express Query**: For checking payment status
5. Click "Create App"

## Step 2: Get API Credentials

After creating your app, you'll get:
- **Consumer Key**: Used for authentication
- **Consumer Secret**: Used for authentication
- **Business Short Code**: Your M-Pesa business number
- **Passkey**: Provided by Safaricom for your business

## Step 3: Configure Environment Variables

Update your `backend/.env` file with your M-Pesa credentials:

```env
# M-Pesa Configuration (Safaricom Daraja API)
MPESA_CONSUMER_KEY=your_actual_consumer_key_here
MPESA_CONSUMER_SECRET=your_actual_consumer_secret_here
MPESA_BUSINESS_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_actual_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox
```

### Important Notes:
- **Sandbox vs Production**: 
  - Use `sandbox` for testing
  - Use `production` for live transactions
- **Callback URL**: Must be publicly accessible (use ngrok for local testing)
- **Business Short Code**: 
  - Sandbox: Use `174379` (Safaricom test shortcode)
  - Production: Use your actual business shortcode

## Step 4: Set Up Callback URL (For Local Development)

Since M-Pesa needs to send callbacks to your server, you need a public URL:

### Option 1: Using ngrok (Recommended for testing)
```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 5000

# Use the https URL provided by ngrok as your callback URL
# Example: https://abc123.ngrok.io/api/payments/mpesa/callback
```

### Option 2: Deploy to a public server
Deploy your backend to services like:
- Heroku
- Railway
- DigitalOcean
- AWS

## Step 5: Test M-Pesa Integration

### Sandbox Testing
1. Set `MPESA_ENVIRONMENT=sandbox` in your `.env`
2. Use test phone numbers provided by Safaricom:
   - `254708374149`
   - `254711111111`
3. Use the sandbox business shortcode: `174379`

### Test Flow:
1. Start your backend server
2. Open your frontend application
3. Go to pricing plans
4. Click "Pay with M-Pesa" for any paid plan
5. Enter a test phone number
6. You should receive an STK push notification
7. Enter the test PIN: `1234`

## Step 6: Production Setup

### Before Going Live:
1. **Business Verification**: Ensure your business is verified with Safaricom
2. **Go-Live Process**: Contact Safaricom to move from sandbox to production
3. **Update Environment**: Change `MPESA_ENVIRONMENT=production`
4. **SSL Certificate**: Ensure your callback URL uses HTTPS
5. **Error Handling**: Implement proper error handling and logging

### Production Checklist:
- [ ] Business account verified
- [ ] Production credentials obtained
- [ ] Callback URL is HTTPS and publicly accessible
- [ ] Error logging implemented
- [ ] Payment reconciliation process in place
- [ ] Customer support process for failed payments

## Step 7: Pricing Configuration

The current M-Pesa pricing is set in `backend/src/controllers/mpesaController.js`:

```javascript
const PLAN_PRICING_KES = {
  pro: 1000, // KES 1,000 (~$10 USD)
  premium: 2500, // KES 2,500 (~$25 USD)
};
```

Adjust these prices based on your business requirements and current exchange rates.

## Troubleshooting

### Common Issues:

1. **"Invalid Access Token"**
   - Check your consumer key and secret
   - Ensure they match your app credentials

2. **"Invalid Business Short Code"**
   - Verify your business shortcode
   - Use `174379` for sandbox testing

3. **"Callback URL not reachable"**
   - Ensure your callback URL is publicly accessible
   - Use ngrok for local testing
   - Check firewall settings

4. **"STK Push not received"**
   - Verify the phone number format
   - Ensure the phone number is registered with M-Pesa
   - Check if the phone has network connectivity

5. **"Payment timeout"**
   - Users have 60 seconds to complete payment
   - Implement proper timeout handling
   - Provide clear instructions to users

### Debugging Tips:

1. **Check Logs**: Monitor your server logs for M-Pesa API responses
2. **Test Callback**: Use tools like Postman to test your callback endpoint
3. **Verify Credentials**: Double-check all environment variables
4. **Network Issues**: Ensure your server can reach Safaricom APIs

## Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **HTTPS Only**: Always use HTTPS for production callback URLs
3. **Validate Callbacks**: Verify callback authenticity
4. **Rate Limiting**: Implement rate limiting for payment endpoints
5. **Logging**: Log all transactions for audit purposes
6. **Error Handling**: Don't expose sensitive information in error messages

## Support

For M-Pesa integration support:
- **Safaricom Developer Portal**: [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- **Documentation**: [developer.safaricom.co.ke/docs](https://developer.safaricom.co.ke/docs)
- **Support Email**: apisupport@safaricom.co.ke

## Testing Credentials (Sandbox Only)

```env
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_ENVIRONMENT=sandbox
```

**Test Phone Numbers:**
- 254708374149
- 254711111111

**Test PIN:** 1234

---

**Note**: This integration is specifically designed for the Kenyan market. For other markets, consider integrating with local mobile money providers or international payment gateways.