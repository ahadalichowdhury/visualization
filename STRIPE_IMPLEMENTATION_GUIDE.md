# 🎯 Stripe Payment Integration - Implementation Guide

## ✅ What's Been Implemented

### 1. Database Layer ✅

- **Migration 009**: Created `stripe_customers` and `payment_history` tables
- **Migration 010**: Added `stripe_price_id` and `stripe_product_id` to `subscription_plans`
- **Models**: Created Stripe customer and payment models

### 2. Backend Services ✅

- **Stripe Service**: Wrapper for Stripe SDK operations
- **Repository Methods**: Database operations for Stripe data
- **Stripe Handler**: API endpoints and webhook processing
- **Go Module**: Added Stripe SDK dependency

---

## 🚀 Next Steps to Complete Implementation

### Step 1: Get Stripe API Keys

1. **Create Stripe Account** (if you don't have one):
   - Go to https://stripe.com
   - Sign up for free account

2. **Get API Keys**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)

3. **Get Webhook Secret**:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "+ Add endpoint"
   - URL: `http://your-backend-url/api/stripe/webhook`
   - Events to listen: Select all `checkout`, `customer.subscription`, and `invoice` events
   - Copy the **Signing secret** (starts with `whsec_`)

### Step 2: Create Products & Prices in Stripe Dashboard

1. **Create Premium Product**:

   ```
   - Go to https://dashboard.stripe.com/test/products
   - Click "+ Add product"
   - Name: "Premium Plan"
   - Description: "For professionals who need unlimited access"
   - Pricing: $19.00 / month (Recurring)
   - Click "Save product"
   - Copy the Price ID (starts with `price_`)
   ```

2. **Update Database with Stripe IDs**:
   ```sql
   docker exec -i visualization-postgres psql -U postgres -d visualization_db -c "
   UPDATE subscription_plans
   SET stripe_price_id = 'price_YOUR_ACTUAL_PRICE_ID_HERE'
   WHERE name = 'premium';
   "
   ```

### Step 3: Configure Backend Environment Variables

Add to your backend `.env` or `docker-compose.yml`:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_NGaDpTRGQtWPa35v6geedC23oFAMvihX
FRONTEND_URL=http://localhost:3000
```

**Update `docker-compose.yml`**:

```yaml
backend:
  environment:
    # ... existing vars ...
    - STRIPE_SECRET_KEY=sk_test_your_secret_key
    - STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
    - FRONTEND_URL=http://localhost:3000
```

### Step 4: Update Backend Configuration

**File: `backend/internal/config/config.go`**

Add Stripe config:

```go
type Config struct {
    // ... existing fields ...
    Stripe StripeConfig
}

type StripeConfig struct {
    SecretKey     string
    WebhookSecret string
    FrontendURL   string
}

func Load() *Config {
    return &Config{
        // ... existing config ...
        Stripe: StripeConfig{
            SecretKey:     getEnv("STRIPE_SECRET_KEY", ""),
            WebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", ""),
            FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:3000"),
        },
    }
}
```

### Step 5: Register Stripe Routes

**File: `backend/internal/api/routes/routes.go`**

Add Stripe initialization and routes:

```go
// Initialize Stripe service
stripeService := stripeService.NewService(cfg.Stripe.SecretKey)

// Initialize Stripe handler
stripeHandler := handlers.NewStripeHandler(
    repo,
    stripeService,
    cfg.Stripe.WebhookSecret,
    cfg.Stripe.FrontendURL,
)

// Stripe routes (protected)
stripeGroup := api.Group("/stripe", middleware.AuthMiddleware(jwtService))
stripeGroup.Post("/create-checkout-session", stripeHandler.CreateCheckoutSession)
stripeGroup.Post("/cancel-subscription", stripeHandler.CancelSubscription)
stripeGroup.Get("/payment-history", stripeHandler.GetPaymentHistory)

// Stripe webhook (public - no auth)
api.Post("/stripe/webhook", stripeHandler.HandleWebhook)
```

### Step 6: Install Stripe.js in Frontend

```bash
cd frontend
npm install @stripe/stripe-js
```

### Step 7: Update Frontend Subscription Page

**File: `frontend/src/pages/Subscription.tsx`**

Add Stripe checkout integration:

```typescript
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe (use your publishable key)
const stripePromise = loadStripe("pk_test_your_publishable_key_here");

// Update handleUpgrade function
const handleUpgrade = async (tier: PricingTier) => {
  if (tier.name.toLowerCase() === currentTier.toLowerCase()) return;

  // For premium upgrades, use Stripe
  if (tier.name === "premium" && tier.price > 0) {
    try {
      setLoading(true);
      setSelectedTier(tier.name);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price_id: tier.stripe_price_id, // From API
            plan_id: tier.id,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkout_url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (error) {
      showError("Failed to start checkout process");
      setLoading(false);
      setSelectedTier(null);
    }
  } else {
    // For downgrades, use the existing API
    // ... existing downgrade code ...
  }
};
```

### Step 8: Create Success/Cancel Pages

**File: `frontend/src/pages/SubscriptionSuccess.tsx`**:

```typescript
export const SubscriptionSuccess = () => {
  useEffect(() => {
    showSuccess("Subscription activated successfully!");
    // Refresh user data
    setTimeout(() => {
      window.location.href = '/subscription';
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">✅ Payment Successful!</h1>
        <p>Your subscription has been activated.</p>
      </div>
    </div>
  );
};
```

**File: `frontend/src/pages/SubscriptionCancel.tsx`**:

```typescript
export const SubscriptionCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">❌ Payment Cancelled</h1>
        <p>You can return to the subscription page to try again.</p>
        <button onClick={() => window.location.href = '/subscription'}>
          Back to Subscription
        </button>
      </div>
    </div>
  );
};
```

**Add routes in `App.tsx`**:

```typescript
<Route path="/subscription/success" element={<SubscriptionSuccess />} />
<Route path="/subscription/cancel" element={<SubscriptionCancel />} />
```

### Step 9: Rebuild & Restart

```bash
# Rebuild backend with Stripe SDK
docker-compose build --no-cache backend

# Restart all services
docker-compose down
docker-compose up -d

# Install frontend dependencies
cd frontend
npm install

# Restart frontend dev server
```

### Step 10: Test with Stripe Test Cards

Use these test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date, any CVC, any ZIP code.

---

## 📋 Testing Checklist

### Payment Flow

- [ ] Click "Upgrade Now" on Premium plan
- [ ] Redirected to Stripe Checkout
- [ ] Enter test card `4242 4242 4242 4242`
- [ ] Payment succeeds
- [ ] Redirected to success page
- [ ] User's subscription_tier updated to "premium"
- [ ] Payment recorded in `payment_history` table

### Webhook Events

- [ ] Checkout session completed
- [ ] Subscription created
- [ ] Invoice payment succeeded
- [ ] Subscription updated
- [ ] Subscription canceled

### Subscription Management

- [ ] View payment history
- [ ] Cancel subscription
- [ ] Reactivate subscription
- [ ] Downgrade to free

---

## 🎯 What Happens on Payment Success

1. **Stripe Checkout** → User pays
2. **Webhook: checkout.session.completed** → Creates Stripe customer record
3. **Webhook: customer.subscription.created** → Updates user tier to "premium"
4. **Webhook: invoice.payment_succeeded** → Records payment in history
5. **User Redirected** → Success page
6. **Frontend** → Refreshes and shows premium features unlocked

---

## 🔒 Security Notes

- ✅ Webhook signature verification (prevents fake webhooks)
- ✅ Authentication required for checkout (user must be logged in)
- ✅ Server-side tier validation (frontend can't fake premium status)
- ✅ Idempotent webhook processing (handles duplicate events)

---

## 📊 Database Schema

### stripe_customers

- Stores Stripe customer ID per user
- Tracks subscription status
- Current billing period

### payment_history

- All payment transactions
- Success/failed payments
- Invoice links and receipts

---

## 💰 Pricing

- **Free**: $0 (no Stripe checkout needed)
- **Premium**: $19/month (Stripe recurring subscription)

---

## 🚀 Going Live (Production)

1. Switch from Test mode to Live mode in Stripe Dashboard
2. Get Live API keys (`pk_live_` and `sk_live_`)
3. Create products/prices in Live mode
4. Update environment variables with live keys
5. Update webhook endpoint to production URL
6. Done!

---

## 📝 Files Created

- ✅ `migrations/009_add_stripe_tables.up.sql`
- ✅ `migrations/010_add_stripe_ids_to_plans.up.sql`
- ✅ `models/stripe.go`
- ✅ `stripe/service.go`
- ✅ `handlers/stripe.go`
- ✅ Repository methods for Stripe data
- ⏳ Frontend integration (pending)
- ⏳ Config updates (pending)
- ⏳ Route registration (pending)

---

## 🎉 Benefits

- **Secure payments** via Stripe
- **Automatic subscription management**
- **Payment history tracking**
- **Webhook-driven updates** (real-time)
- **Test mode** for development
- **PCI compliance** handled by Stripe

---

**Status**: Backend implementation complete, awaiting configuration and frontend integration!

**Next Action**: Follow steps 1-10 above to complete the integration.
