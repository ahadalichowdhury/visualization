package email

import (
	"fmt"

	"gopkg.in/gomail.v2"
)

// Service handles email sending
type Service struct {
	host        string
	port        int
	username    string
	password    string
	from        string
	fromName    string
	frontendURL string
}

// NewService creates a new email service
func NewService(host string, port int, username, password, from, fromName, frontendURL string) *Service {
	return &Service{
		host:        host,
		port:        port,
		username:    username,
		password:    password,
		from:        from,
		fromName:    fromName,
		frontendURL: frontendURL,
	}
}

// SendPasswordResetEmail sends password reset email with token
func (s *Service) SendPasswordResetEmail(toEmail, toName, token string) error {
	m := gomail.NewMessage()

	// Set sender
	m.SetHeader("From", m.FormatAddress(s.from, s.fromName))

	// Set recipient
	if toName != "" {
		m.SetHeader("To", m.FormatAddress(toEmail, toName))
	} else {
		m.SetHeader("To", toEmail)
	}

	// Set subject
	m.SetHeader("Subject", "Reset Your Password - Visualization Platform")

	// Build reset URL
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, token)

	// HTML email body
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0; text-align: center;">
                <table role="presentation" style="width: 600px; max-width: 100%%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 50px 40px 30px; text-align: center; background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%%%%, #7c3aed 100%%%%); border-radius: 12px 12px 0 0;">
                            <table role="presentation" style="margin: 0 auto 20px;">
                                <tr>
                                    <td style="background-color: rgba(255, 255, 255, 0.2); width: 80px; height: 80px; border-radius: 50%%; text-align: center; vertical-align: middle; line-height: 80px;">
                                        <span style="font-size: 48px;">🔐</span>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Password Reset</h1>
                            <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">Secure your account with a new password</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px;">Hello%s!</h2>
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                You recently requested to reset your password for your <strong>Visualization Platform</strong> account. We've received your request and generated a secure reset link for you.
                            </p>
                            
                            <!-- Button - Enhanced Styling -->
                            <table role="presentation" style="margin: 40px 0; width: 100%%;">
                                <tr>
                                    <td style="text-align: center;">
                                        <!-- Outer container for shadow effect -->
                                        <table role="presentation" style="margin: 0 auto; border-spacing: 0;">
                                            <tr>
                                                <td style="background-color: #2563eb; background-image: linear-gradient(135deg, #2563eb 0%%%%, #7c3aed 100%%%%); border-radius: 12px; padding: 3px;">
                                                    <!-- Inner button -->
                                                    <a href="%s" style="display: block; padding: 18px 50px; background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 20px; letter-spacing: 0.5px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.3);">
                                                        <span style="font-size: 24px; vertical-align: middle; margin-right: 10px;">🔐</span>
                                                        <span style="vertical-align: middle;">Reset Your Password</span>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <!-- Subtle shadow effect using border -->
                                        <div style="margin: -8px auto 0; width: 90%%; height: 8px; background: linear-gradient(180deg, rgba(37, 99, 235, 0.2) 0%%, transparent 100%%); border-radius: 0 0 12px 12px; max-width: 320px;"></div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 20px; padding: 14px; background-color: #f3f4f6; border-radius: 8px; word-break: break-all; font-size: 13px; color: #4b5563; border: 1px solid #e5e7eb;">
                                %s
                            </p>
                            
                            <!-- Security Notice Box - Enhanced -->
                            <table role="presentation" style="margin: 40px auto; width: 100%%; max-width: 500px; background-color: #fef3c7; background-image: linear-gradient(135deg, #fef3c7 0%%%%, #fde68a 100%%%%); border-radius: 12px; border-left: 6px solid #f59e0b; overflow: hidden;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <!-- Title with icon -->
                                        <table role="presentation" style="width: 100%%;">
                                            <tr>
                                                <td style="text-align: center; padding-bottom: 15px;">
                                                    <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.2); padding: 12px; border-radius: 50%%; width: 50px; height: 50px; line-height: 50px; text-align: center;">
                                                        <span style="font-size: 28px;">⚠️</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                        <h3 style="margin: 0 0 15px; color: #92400e; font-size: 18px; font-weight: bold; text-align: center;">
                                            Important Security Notice
                                        </h3>
                                        <!-- Bullet points -->
                                        <table role="presentation" style="width: 100%%;">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation">
                                                        <tr>
                                                            <td style="vertical-align: top; padding-right: 10px; color: #78350f; font-size: 18px;">•</td>
                                                            <td style="color: #78350f; font-size: 15px; line-height: 1.6;">
                                                                This link will <strong style="color: #92400e;">EXPIRE in 30 MINUTES</strong> from when it was generated
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation">
                                                        <tr>
                                                            <td style="vertical-align: top; padding-right: 10px; color: #78350f; font-size: 18px;">•</td>
                                                            <td style="color: #78350f; font-size: 15px; line-height: 1.6;">
                                                                The link can only be used <strong style="color: #92400e;">ONCE</strong>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <table role="presentation">
                                                        <tr>
                                                            <td style="vertical-align: top; padding-right: 10px; color: #78350f; font-size: 18px;">•</td>
                                                            <td style="color: #78350f; font-size: 15px; line-height: 1.6;">
                                                                After 30 minutes, you'll need to request a new reset link
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box - Enhanced -->
                            <table role="presentation" style="margin: 30px auto; width: 100%%; max-width: 500px; background-color: #eff6ff; background-image: linear-gradient(135deg, #eff6ff 0%%%%, #dbeafe 100%%%%); border-radius: 12px; border-left: 6px solid #3b82f6; overflow: hidden;">
                                <tr>
                                    <td style="padding: 20px 25px;">
                                        <table role="presentation" style="width: 100%%;">
                                            <tr>
                                                <td style="vertical-align: top; padding-right: 15px; width: 50px;">
                                                    <div style="background-color: rgba(59, 130, 246, 0.2); padding: 10px; border-radius: 50%%; width: 40px; height: 40px; line-height: 40px; text-align: center;">
                                                        <span style="font-size: 24px;">🛡️</span>
                                                    </div>
                                                </td>
                                                <td style="vertical-align: top;">
                                                    <h4 style="margin: 0 0 10px; color: #1e40af; font-size: 16px; font-weight: bold;">
                                                        Didn't request this?
                                                    </h4>
                                                    <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                                                        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                Need help? Contact us at <a href="mailto:support@visualizationplatform.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">support@visualizationplatform.com</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 40px; background-color: #f9fafb; background-image: linear-gradient(180deg, #f9fafb 0%%%%, #f3f4f6 100%%%%); border-radius: 0 0 12px 12px; text-align: center; border-top: 2px solid #e5e7eb;">
                            <p style="margin: 0 0 12px; color: #4b5563; font-size: 14px; font-weight: 500;">
                                Visualization Platform
                            </p>
                            <p style="margin: 0 0 16px; color: #6b7280; font-size: 12px;">
                                © 2026 Visualization Platform. All rights reserved.
                            </p>
                            <table role="presentation" style="margin: 16px auto; max-width: 400px; background-color: #fff7ed; background-image: linear-gradient(135deg, #fff7ed 0%%%%, #ffedd5 100%%%%); border-radius: 10px; border: 2px solid #fed7aa; overflow: hidden;">
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <table role="presentation" style="width: 100%%;">
                                            <tr>
                                                <td style="vertical-align: top; padding-right: 12px; width: 40px;">
                                                    <div style="background-color: rgba(251, 146, 60, 0.2); padding: 8px; border-radius: 50%%; width: 32px; height: 32px; line-height: 32px; text-align: center;">
                                                        <span style="font-size: 18px;">⚡</span>
                                                    </div>
                                                </td>
                                                <td style="vertical-align: top;">
                                                    <p style="margin: 0; color: #9a3412; font-size: 13px; line-height: 1.6;">
                                                        <strong style="color: #7c2d12;">Quick Tip:</strong> For security reasons, we recommend using a strong, unique password that you don't use on other websites.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 16px 0 0; color: #9ca3af; font-size: 11px;">
                                This is an automated security email. Please do not reply to this message.<br>
                                If you have questions, contact us at support@visualizationplatform.com
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`, getNamePrefix(toName), resetURL, resetURL)

	/*
	// Plain text version (fallback) - Enhanced styling with ASCII art
	// Currently disabled - Gmail will auto-generate plain text from HTML
	plainBody := fmt.Sprintf(`
╔══════════════════════════════════════════════════════════════╗
║                    🔐 PASSWORD RESET                         ║
║              Visualization Platform                          ║
╚══════════════════════════════════════════════════════════════╝

Hello%s!

You recently requested to reset your password for your Visualization 
Platform account. We've received your request and generated a secure 
reset link for you.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 RESET YOUR PASSWORD:

Click or copy this link to reset your password:
%s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT SECURITY NOTICE:

• This link will EXPIRE in 30 MINUTES from when it was generated
• The link can only be used ONCE
• After 30 minutes, you'll need to request a new reset link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️  DIDN'T REQUEST THIS?

If you didn't request a password reset, you can safely ignore this 
email. Your password will remain unchanged and your account is secure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Visit our support page or contact us at:
support@visualizationplatform.com

Best regards,
The Visualization Platform Team

──────────────────────────────────────────────────────────────
© 2026 Visualization Platform. All rights reserved.
This is an automated email. Please do not reply to this message.
──────────────────────────────────────────────────────────────
`, getNamePrefix(toName), resetURL)
	*/

	// Set email body - Send HTML only (Gmail will auto-generate plain text if needed)
	m.SetBody("text/html", htmlBody)

	// Create dialer and send
	d := gomail.NewDialer(s.host, s.port, s.username, s.password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// getNamePrefix returns a formatted name prefix for email greeting
func getNamePrefix(name string) string {
	if name != "" {
		return ", " + name
	}
	return ""
}

// SendWelcomeEmail sends welcome email to new users (optional)
func (s *Service) SendWelcomeEmail(toEmail, toName string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", m.FormatAddress(s.from, s.fromName))

	if toName != "" {
		m.SetHeader("To", m.FormatAddress(toEmail, toName))
	} else {
		m.SetHeader("To", toEmail)
	}

	m.SetHeader("Subject", "Welcome to Visualization Platform!")

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #2563eb; margin: 0 0 20px;">Welcome to Visualization Platform! 🎉</h1>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Hello%s!</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for joining Visualization Platform. You can now design, simulate, and optimize cloud architectures!
        </p>
        <a href="%s/dashboard" style="display: inline-block; margin: 20px 0; padding: 14px 32px; background: linear-gradient(135deg, #2563eb 0%%%%, #7c3aed 100%%%%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Happy designing!</p>
    </div>
</body>
</html>
`, getNamePrefix(toName), s.frontendURL)

	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(s.host, s.port, s.username, s.password)
	return d.DialAndSend(m)
}
