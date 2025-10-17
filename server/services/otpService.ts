import { MailService } from "@sendgrid/mail";
import twilio from "twilio";

// Initialize Twilio client for Verify Service
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
  console.log("Twilio client initialized successfully");
  
  if (process.env.TWILIO_VERIFY_SERVICE_SID) {
    console.log("Twilio Verify Service configured - SMS and Email OTP enabled");
  } else {
    console.warn("TWILIO_VERIFY_SERVICE_SID not set - OTP delivery will be disabled");
  }
} else {
  console.warn(
    "Twilio environment variables not set - OTP delivery will be disabled",
  );
  console.warn("Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID");
}

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
 * Send OTP using Twilio Verify Service
 * Twilio Verify automatically generates and sends the OTP code
 */
export async function sendOTPWithVerify({
  to,
  channel,
  purpose = 'signup',
}: SendOTPParams): Promise<{ success: boolean; error?: string }> {
  // Check if Twilio Verify is configured
  if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "OTP delivery failed in production - Twilio Verify not configured",
      );
      return {
        success: false,
        error: "Verification service not available. Please contact support.",
      };
    }
    // Development mode - log the OTP request
    console.log(`[DEV MODE] Would send ${channel} OTP to ${to} for ${purpose}`);
    return { success: true };
  }

  try {
    // Create verification using Twilio Verify Service
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: to,
        channel: channel, // 'sms' or 'email'
      });

    console.log(
      `Twilio Verify ${channel} OTP sent to ${to}. Status: ${verification.status}, SID: ${verification.sid}`,
    );
    
    return { success: true };
  } catch (error: any) {
    // Enhanced Twilio error logging
    console.error("Twilio Verify send error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      details: error.details,
      to: to,
      channel: channel,
      purpose: purpose,
    });

    let userFriendlyError = "Failed to send verification code";

    // Handle specific Twilio error codes
    if (error.code) {
      switch (error.code) {
        case 60200:
          userFriendlyError = "Invalid phone number or email format. Please check and try again.";
          break;
        case 60203:
          userFriendlyError = "Maximum verification attempts reached. Please try again later.";
          break;
        case 60205:
          userFriendlyError = "SMS not supported for this phone number.";
          break;
        case 60212:
          userFriendlyError = "Too many verification requests. Please wait before trying again.";
          break;
        case 60223:
          userFriendlyError = "Invalid or unsupported country code.";
          break;
        default:
          userFriendlyError = `Verification failed (${error.code}). Please try again.`;
      }
    }

    // Fallback to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV FALLBACK] ${channel} OTP for ${to} (${purpose})`);
      return { success: true };
    }

    return { success: false, error: userFriendlyError };
  }
}

/**
 * Verify OTP code using Twilio Verify Service
 */
export async function verifyOTPWithVerify({
  to,
  code,
}: VerifyOTPParams): Promise<{ success: boolean; error?: string }> {
  // Check if Twilio Verify is configured
  if (!twilioClient || !process.env.TWILIO_VERIFY_SERVICE_SID) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "OTP verification failed in production - Twilio Verify not configured",
      );
      return {
        success: false,
        error: "Verification service not available. Please contact support.",
      };
    }
    // Development mode - accept any 6-digit code
    if (/^\d{6}$/.test(code)) {
      console.log(`[DEV MODE] Would verify OTP ${code} for ${to}`);
      return { success: true };
    }
    return { success: false, error: "Invalid verification code format" };
  }

  try {
    // Verify the code using Twilio Verify Service
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: to,
        code: code,
      });

    console.log(
      `Twilio Verify check for ${to}. Status: ${verificationCheck.status}, Valid: ${verificationCheck.valid}`,
    );

    if (verificationCheck.status === 'approved' && verificationCheck.valid) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: "Invalid or expired verification code" 
      };
    }
  } catch (error: any) {
    console.error("Twilio Verify check error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      to: to,
    });

    let userFriendlyError = "Verification failed";

    // Handle specific Twilio error codes
    if (error.code) {
      switch (error.code) {
        case 60200:
          userFriendlyError = "Invalid phone number or email format.";
          break;
        case 60202:
          userFriendlyError = "Maximum verification attempts exceeded. Please request a new code.";
          break;
        case 60203:
          userFriendlyError = "Maximum check attempts reached. Please request a new code.";
          break;
        case 60210:
          userFriendlyError = "Invalid verification code or verification expired.";
          break;
        default:
          userFriendlyError = `Verification failed (${error.code}). Please try again.`;
      }
    }

    // Fallback to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV FALLBACK] Verify OTP ${code} for ${to}`);
      // Accept any 6-digit code in development
      if (/^\d{6}$/.test(code)) {
        return { success: true };
      }
    }

    return { success: false, error: userFriendlyError };
  }
}

/**
 * Main function to send OTP via appropriate channel
 * Automatically determines if target is email or phone
 */
export async function sendOTP(
  target: string,
  purpose: "signup" | "reset" | "login" = "signup",
): Promise<{ success: boolean; error?: string }> {
  // Determine if target is email or phone number
  const isEmail = target.includes("@");
  const isPhone = target.startsWith("+") && /^\+[1-9]\d{1,14}$/.test(target);

  if (isEmail) {
    return await sendOTPWithVerify({ to: target, channel: 'email', purpose });
  } else if (isPhone) {
    return await sendOTPWithVerify({ to: target, channel: 'sms', purpose });
  } else {
    return {
      success: false,
      error: "Invalid format - must be email or phone number in E.164 format (e.g., +15551234567)",
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  target: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  return await verifyOTPWithVerify({ to: target, code });
}
