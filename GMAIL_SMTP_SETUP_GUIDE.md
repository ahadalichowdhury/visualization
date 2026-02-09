# Gmail SMTP Setup Guide for Password Reset Emails

The password reset functionality is now **fully implemented** and uses Gmail SMTP to send emails. Follow this guide to set it up.

## ✅ What's Been Implemented

1. **Email Service** (`backend/internal/email/service.go`)
   - `SendPasswordResetEmail()` - Beautiful HTML email with reset link
   - `SendWelcomeEmail()` - Optional welcome email for new users
   - Professional email templates with proper styling

2. **Backend Integration**
   - Email service initialized in `cmd/server/main.go`
   - Auth handler updated to send emails in `RequestPasswordReset()`
   - Proper error handling and logging

3. **Frontend** (Already Complete)
   - `/forgot-password` - Request password reset
   - `/reset-password?token=xxx` - Reset password with token
   - Beautiful, responsive UI with dark mode support

## 🔧 Gmail SMTP Configuration

### Step 1: Get Gmail App Password

Since Gmail doesn't allow less secure apps anymore, you need to create an **App Password**:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Under "How you sign in to Google", enable "2-Step Verification"

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "Visualization Platform"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again)

### Step 2: Configure Environment Variables

Create/Update your `backend/.env` file with these settings:

```env
# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=Visualization Platform

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**
- `SMTP_USERNAME`: Your full Gmail address (e.g., `yourname@gmail.com`)
- `SMTP_PASSWORD`: The 16-character app password (NO spaces)
- `SMTP_FROM`: Can be different from your Gmail (for branding)
- `SMTP_FROM_NAME`: Display name in emails
- `FRONTEND_URL`: Change to your production URL when deploying

### Step 3: Restart Backend Server

```bash
cd backend
# Make sure .env is loaded (if using docker-compose, it's automatic)
go run cmd/server/main.go
```

You should see this log:
```
Email service initialized
```

## 🧪 Testing Password Reset

### Test Flow:

1. **Request Password Reset**
   ```bash
   curl -X POST http://localhost:8080/api/auth/password/forgot \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com"}'
   ```

   **Response:**
   ```json
   {
     "message": "If the email exists, a reset link has been sent"
   }
   ```

2. **Check Email**
   - Open the user's email inbox
   - Look for email from "Visualization Platform"
   - Click the "Reset Your Password" button
   - Or copy the reset link

3. **Reset Password**
   - User clicks link → redirected to `/reset-password?token=xxx`
   - Enter new password
   - Submit → Password updated

### Manual Testing via Frontend:

1. Navigate to `http://localhost:3000/forgot-password`
2. Enter email address
3. Submit form
4. Check email inbox
5. Click reset link
6. Enter new password
7. Login with new password

## 📧 Email Preview

The password reset email includes:

- **Professional gradient header** with lock icon
- **Personalized greeting** (uses user's name if available)
- **Large "Reset Your Password" button** with gradient styling
- **Plain text link** as fallback
- **30-minute expiration warning**
- **Security notice** (safe to ignore if not requested)
- **Professional footer** with branding

**Responsive Design:** Works on desktop, tablet, and mobile devices.

## 🚨 Common Issues & Solutions

### Issue 1: "Failed to send email" error

**Possible causes:**
- Wrong app password (check for spaces or typos)
- 2FA not enabled on Gmail
- Firewall blocking SMTP port 587

**Solution:**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587
```

### Issue 2: Emails going to spam

**Solution:**
- Add SPF record to your domain (production)
- Warm up your sending IP gradually
- For development, check spam folder

### Issue 3: "Email service initialized" not showing

**Possible causes:**
- `.env` file not loaded
- Wrong environment variable names

**Solution:**
```bash
# Check if env vars are loaded
cd backend
cat .env | grep SMTP
```

### Issue 4: Reset link not working

**Possible causes:**
- `FRONTEND_URL` is wrong
- Token expired (30 minutes)
- Token already used

**Solution:**
- Verify `FRONTEND_URL` matches your frontend
- Request a new reset link

## 🌐 Production Deployment

### Important Changes for Production:

1. **Update `FRONTEND_URL`** in `.env`:
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Use a professional `SMTP_FROM` email**:
   ```env
   SMTP_FROM=noreply@yourdomain.com
   SMTP_FROM_NAME=Your Platform Name
   ```

3. **Consider using a dedicated email service** for high volume:
   - [SendGrid](https://sendgrid.com) (Free tier: 100 emails/day)
   - [AWS SES](https://aws.amazon.com/ses/) (Free tier: 62,000 emails/month)
   - [Mailgun](https://www.mailgun.com/) (Free tier: 5,000 emails/month)

   Gmail SMTP is fine for development and small-scale apps, but has limits:
   - **500 recipients per day** for regular Gmail
   - **2,000 recipients per day** for Google Workspace

4. **Set up SPF/DKIM records** for better deliverability

5. **Monitor email logs**:
   ```bash
   # Backend logs show email delivery status
   tail -f backend/logs/app.log | grep "Password reset email"
   ```

## 🔐 Security Features

The implementation includes:

1. **Token Expiration** - Tokens expire after 30 minutes
2. **Single Use Tokens** - Each token can only be used once
3. **No Email Leakage** - API doesn't reveal if email exists
4. **Secure Token Generation** - Cryptographically secure random tokens (64 characters)
5. **Password Validation** - Minimum 6 characters (you can increase this)

## 📝 Optional: Send Welcome Emails

The email service also includes a `SendWelcomeEmail()` function. To send welcome emails on signup:

**Update `auth.go` Signup handler** (around line 63):

```go
// After successful signup
if err := h.emailService.SendWelcomeEmail(user.Email, userName); err != nil {
    log.Printf("Failed to send welcome email to %s: %v", user.Email, err)
    // Don't fail signup if email fails
}
```

## ✅ Completion Checklist

- [ ] Gmail 2FA enabled
- [ ] App Password generated
- [ ] `.env` file updated with SMTP credentials
- [ ] Backend restarted
- [ ] "Email service initialized" log appears
- [ ] Password reset tested successfully
- [ ] Email received in inbox (check spam if not)
- [ ] Reset link works correctly
- [ ] Password updated successfully
- [ ] Can login with new password

## 🎉 You're Done!

Your password reset functionality is now fully operational with Gmail SMTP!

If you have any issues, check the backend logs:
```bash
cd backend
go run cmd/server/main.go
# Watch for email-related logs
```

---

**Need help?** Check the implementation files:
- `backend/internal/email/service.go` - Email service
- `backend/internal/api/handlers/auth.go` - Auth handler
- `frontend/src/components/auth/PasswordReset.tsx` - Frontend UI
