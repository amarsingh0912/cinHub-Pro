import { MailService } from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email OTP delivery will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn("Twilio environment variables not set - SMS OTP delivery will be disabled");
  console.warn("Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
}

interface EmailOTPParams {
  to: string;
  otpCode: string;
  purpose: 'signup' | 'reset' | 'login';
}

interface SMSOTPParams {
  to: string;
  otpCode: string;
  purpose: 'signup' | 'reset' | 'login';
}

// Email templates for different OTP purposes
function getEmailTemplate(purpose: 'signup' | 'reset' | 'login', otpCode: string) {
  const templates = {
    signup: {
      subject: 'Verify Your CineHub Pro Account',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Welcome to CineHub Pro!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Your movie discovery journey starts here</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Verify Your Account</h2>
            <p>Thank you for signing up! To complete your registration and start exploring movies, please verify your account with the code below:</p>
            
            <div style="background: #f8f9ff; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 10px; color: #666;">Your verification code is:</p>
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otpCode}</h1>
            </div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't create an account with CineHub Pro, please ignore this email.</p>
            
            <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 6px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>What's next?</strong> Once verified, you'll be able to create watchlists, rate movies, write reviews, and get personalized recommendations.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #666; font-size: 14px;">© 2025 CineHub Pro. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Welcome to CineHub Pro!\n\nYour verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account with CineHub Pro, please ignore this email.`
    },
    reset: {
      subject: 'Reset Your CineHub Pro Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Secure your CineHub Pro account</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Reset Your Password</h2>
            <p>We received a request to reset your CineHub Pro password. Use the verification code below to proceed:</p>
            
            <div style="background: #f8f9ff; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 10px; color: #666;">Your password reset code is:</p>
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otpCode}</h1>
            </div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <div style="margin-top: 40px; padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security tip:</strong> Never share this code with anyone. CineHub Pro will never ask for your verification code.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #666; font-size: 14px;">© 2025 CineHub Pro. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Password Reset Request\n\nYour password reset code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.`
    },
    login: {
      subject: 'Your CineHub Pro Login Code',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Login Verification</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Secure access to your account</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Complete Your Login</h2>
            <p>Use the verification code below to complete your login to CineHub Pro:</p>
            
            <div style="background: #f8f9ff; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 10px; color: #666;">Your login code is:</p>
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otpCode}</h1>
            </div>
            
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't attempt to log in, please secure your account immediately.</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #666; font-size: 14px;">© 2025 CineHub Pro. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `Login Verification\n\nYour login code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't attempt to log in, please secure your account immediately.`
    }
  };
  
  return templates[purpose];
}

// SMS templates for different OTP purposes
function getSMSTemplate(purpose: 'signup' | 'reset' | 'login', otpCode: string) {
  const templates = {
    signup: `CineHub Pro: Your account verification code is ${otpCode}. This code expires in 10 minutes. Welcome to your movie journey!`,
    reset: `CineHub Pro: Your password reset code is ${otpCode}. This code expires in 10 minutes. Keep your account secure!`,
    login: `CineHub Pro: Your login verification code is ${otpCode}. This code expires in 10 minutes.`
  };
  
  return templates[purpose];
}

export async function sendEmailOTP({ to, otpCode, purpose }: EmailOTPParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`[DEV MODE] Email OTP for ${to}: ${otpCode} (${purpose})`);
    return { success: true };
  }

  try {
    const template = getEmailTemplate(purpose, otpCode);
    
    await mailService.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cinehub.pro', // You can set this env var
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log(`Email OTP sent successfully to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    // Fallback to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV FALLBACK] Email OTP for ${to}: ${otpCode} (${purpose})`);
      return { success: true };
    }
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export async function sendSMSOTP({ to, otpCode, purpose }: SMSOTPParams): Promise<{ success: boolean; error?: string }> {
  if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
    console.log(`[DEV MODE] SMS OTP for ${to}: ${otpCode} (${purpose})`);
    return { success: true };
  }

  try {
    const message = getSMSTemplate(purpose, otpCode);
    
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log(`SMS OTP sent successfully to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    // Fallback to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV FALLBACK] SMS OTP for ${to}: ${otpCode} (${purpose})`);
      return { success: true };
    }
    return { success: false, error: error.message || 'Failed to send SMS' };
  }
}

// Main function to send OTP via appropriate channel
export async function sendOTP(target: string, otpCode: string, purpose: 'signup' | 'reset' | 'login'): Promise<{ success: boolean; error?: string }> {
  // Determine if target is email or phone number
  const isEmail = target.includes('@');
  const isPhone = target.startsWith('+') && /^\+[1-9]\d{1,14}$/.test(target);

  if (isEmail) {
    return await sendEmailOTP({ to: target, otpCode, purpose });
  } else if (isPhone) {
    return await sendSMSOTP({ to: target, otpCode, purpose });
  } else {
    return { success: false, error: 'Invalid target format - must be email or phone number in E.164 format' };
  }
}