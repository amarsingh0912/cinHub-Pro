import sgMail from "@sendgrid/mail";
import twilio from "twilio";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid configured successfully");
} else {
  console.warn("SENDGRID_API_KEY not set - Email OTP delivery will be disabled");
}

// Lazy initialization of Twilio client
let twilioClient: any = null;
function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }
  
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    console.log("Twilio client initialized successfully");
    return twilioClient;
  }
  
  return null;
}

interface EmailOTPParams {
  to: string;
  otpCode: string;
  purpose: "signup" | "reset" | "login";
}

interface SMSOTPParams {
  to: string;
  otpCode: string;
  purpose: "signup" | "reset" | "login";
}

/**
 * Send OTP via email using SendGrid
 */
export async function sendEmailOTP({
  to,
  otpCode,
  purpose,
}: EmailOTPParams): Promise<{ success: boolean; error?: string }> {
  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      console.error("Email OTP failed in production - SendGrid not configured");
      return {
        success: false,
        error: "Email service not available. Please contact support.",
      };
    }
    // Development mode - log the OTP
    console.log(`[DEV MODE] Email OTP for ${to}: ${otpCode} (${purpose})`);
    return { success: true };
  }

  try {
    const subject =
      purpose === "signup"
        ? "Verify Your CineHub Pro Account"
        : purpose === "reset"
        ? "Reset Your CineHub Pro Password"
        : "CineHub Pro Login Verification";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">CineHub Pro</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
          <p>Hello,</p>
          <p>${
            purpose === "signup"
              ? "Thank you for signing up for CineHub Pro! Please use the code below to verify your account:"
              : purpose === "reset"
              ? "We received a request to reset your password. Use the code below to continue:"
              : "Please use the code below to complete your login:"
          }</p>
          <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otpCode}
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">
            This code will expire in 10 minutes. If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            CineHub Pro - Your Movie Discovery Platform<br>
            This is an automated email, please do not reply.
          </p>
        </div>
      </body>
      </html>
    `;

    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@cinehubpro.com",
      subject,
      html: htmlContent,
    });

    console.log(`Email OTP sent to ${to} for ${purpose}`);
    return { success: true };
  } catch (error: any) {
    console.error("SendGrid error:", error);

    // Fallback to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV FALLBACK] Email OTP for ${to}: ${otpCode} (${purpose})`);
      return { success: true };
    }

    return {
      success: false,
      error: "Failed to send verification email. Please try again.",
    };
  }
}

/**
 * Send OTP via SMS using Twilio
 */
export async function sendSMSOTP({
  to,
  otpCode,
  purpose,
}: SMSOTPParams): Promise<{ success: boolean; error?: string }> {
  // Validate phone number format (E.164)
  if (!to.startsWith("+") || !/^\+\d{10,15}$/.test(to)) {
    return {
      success: false,
      error: "Invalid phone number format. Please use E.164 format (e.g., +15551234567)",
    };
  }

  // Check if Twilio is configured
  const client = getTwilioClient();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      console.error("SMS OTP failed in production - Twilio not configured");
      return {
        success: false,
        error: "SMS service not available. Please contact support.",
      };
    }
    // Development mode - log the OTP
    console.log(`[DEV MODE] SMS OTP for ${to}: ${otpCode} (${purpose})`);
    return { success: true };
  }

  try {
    const message =
      purpose === "signup"
        ? `Welcome to CineHub Pro! Your verification code is: ${otpCode}. Valid for 10 minutes.`
        : purpose === "reset"
        ? `Your CineHub Pro password reset code is: ${otpCode}. Valid for 10 minutes.`
        : `Your CineHub Pro login code is: ${otpCode}. Valid for 10 minutes.`;

    const messageParams: any = {
      body: message,
      to,
    };

    // Use messaging service SID if available, otherwise use from phone number
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      messageParams.from = process.env.TWILIO_PHONE_NUMBER;
    } else {
      console.error("Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is set");
      return {
        success: false,
        error: "SMS service configuration error. Please contact support.",
      };
    }

    const result = await client.messages.create(messageParams);

    console.log(`SMS OTP sent to ${to} for ${purpose}. SID: ${result.sid}`);
    return { success: true };
  } catch (error: any) {
    console.error("Twilio error:", error);

    let userFriendlyError = "Failed to send SMS verification code";

    // Handle specific Twilio error codes
    if (error.code) {
      switch (error.code) {
        case 21211:
          userFriendlyError = "Invalid phone number format. Please check and try again.";
          break;
        case 21408:
          userFriendlyError = "Phone number doesn't support SMS.";
          break;
        case 21610:
          userFriendlyError = "Phone number is not subscribed to receive messages.";
          break;
        default:
          userFriendlyError = `SMS delivery failed (${error.code}). Please try again.`;
      }
    }

    // Fallback to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV FALLBACK] SMS OTP for ${to}: ${otpCode} (${purpose})`);
      return { success: true };
    }

    return { success: false, error: userFriendlyError };
  }
}

/**
 * Auto-detect target type and send OTP
 */
export async function sendOTP(
  target: string,
  otpCode: string,
  purpose: "signup" | "reset" | "login" = "signup",
): Promise<{ success: boolean; error?: string; message?: string }> {
  // Detect if target is email or phone
  const isEmail = target.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
  const isPhone = target.startsWith("+") && /^\+\d{10,15}$/.test(target);

  if (!isEmail && !isPhone) {
    return {
      success: false,
      error: "Invalid target format. Please provide a valid email or phone number in E.164 format.",
    };
  }

  if (isEmail) {
    const result = await sendEmailOTP({ to: target, otpCode, purpose });
    if (result.success) {
      return {
        success: true,
        message: "Verification code sent to your email. Please check your inbox and spam folder.",
      };
    }
    return result;
  } else {
    const result = await sendSMSOTP({ to: target, otpCode, purpose });
    if (result.success) {
      return {
        success: true,
        message: "Verification code sent to your phone via SMS.",
      };
    }
    return result;
  }
}

// Keep the Verify service functions for backward compatibility if needed
interface SendOTPParams {
  to: string;
  channel: 'sms' | 'email';
  purpose?: "signup" | "reset" | "login";
}

interface VerifyOTPParams {
  to: string;
  code: string;
}

/**
 * Send OTP using Twilio Verify Service (alternative method)
 */
export async function sendOTPWithVerify({
  to,
  channel,
  purpose = 'signup',
}: SendOTPParams): Promise<{ success: boolean; error?: string }> {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    if (process.env.NODE_ENV === "production") {
      console.error("OTP delivery failed in production - Twilio Verify not configured");
      return {
        success: false,
        error: "Verification service not available. Please contact support.",
      };
    }
    console.log(`[DEV MODE] Would send ${channel} OTP to ${to} for ${purpose}`);
    return { success: true };
  }

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to, channel });

    console.log(`Twilio Verify ${channel} OTP sent to ${to}. Status: ${verification.status}`);
    return { success: true };
  } catch (error: any) {
    console.error("Twilio Verify send error:", error);
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV FALLBACK] ${channel} OTP for ${to} (${purpose})`);
      return { success: true };
    }
    return { success: false, error: "Failed to send verification code" };
  }
}

/**
 * Verify OTP code using Twilio Verify Service (alternative method)
 */
export async function verifyOTPWithVerify({
  to,
  code,
}: VerifyOTPParams): Promise<{ success: boolean; error?: string }> {
  const client = getTwilioClient();
  if (!client || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    if (process.env.NODE_ENV === "production") {
      console.error("OTP verification failed in production - Twilio Verify not configured");
      return {
        success: false,
        error: "Verification service not available. Please contact support.",
      };
    }
    if (/^\d{6}$/.test(code)) {
      console.log(`[DEV MODE] Would verify OTP ${code} for ${to}`);
      return { success: true };
    }
    return { success: false, error: "Invalid verification code format" };
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code });

    if (verificationCheck.status === 'approved' && verificationCheck.valid) {
      return { success: true };
    }
    return { success: false, error: "Invalid or expired verification code" };
  } catch (error: any) {
    console.error("Twilio Verify check error:", error);
    if (process.env.NODE_ENV === "development" && /^\d{6}$/.test(code)) {
      console.log(`[DEV FALLBACK] Verify OTP ${code} for ${to}`);
      return { success: true };
    }
    return { success: false, error: "Verification failed" };
  }
}

/**
 * Verify OTP code (simple verification)
 */
export async function verifyOTP(
  target: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  return await verifyOTPWithVerify({ to: target, code });
}
