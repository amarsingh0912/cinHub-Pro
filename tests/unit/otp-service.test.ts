import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmailOTP, sendSMSOTP, sendOTP } from '../../server/services/otpService';

// Mock SendGrid - match actual implementation
const mockSend = vi.fn();
const mockSetApiKey = vi.fn();

const mockMailService = {
  setApiKey: mockSetApiKey,
  send: mockSend,
};

vi.mock('@sendgrid/mail', () => ({
  MailService: vi.fn(() => mockMailService),
  default: mockMailService,
}));

// Mock Twilio
const mockCreate = vi.fn();
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

describe('OTP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('sendEmailOTP', () => {
    it('should send email OTP with correct template for signup', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';
      mockSend.mockResolvedValue([{ statusCode: 202 }]);

      const result = await sendEmailOTP({
        to: 'test@example.com',
        otpCode: '123456',
        purpose: 'signup',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Verify Your CineHub Pro Account'),
          html: expect.stringContaining('123456'),
        })
      );
    });

    it('should send email OTP with correct template for password reset', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';
      mockSend.mockResolvedValue([{ statusCode: 202 }]);

      const result = await sendEmailOTP({
        to: 'test@example.com',
        otpCode: '654321',
        purpose: 'reset',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Reset Your CineHub Pro Password'),
          html: expect.stringContaining('654321'),
        })
      );
    });

    it('should handle SendGrid errors gracefully', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.NODE_ENV = 'production';
      mockSend.mockRejectedValue(new Error('SendGrid error'));

      const result = await sendEmailOTP({
        to: 'test@example.com',
        otpCode: '123456',
        purpose: 'signup',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should fallback to console in development when SendGrid fails', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';
      process.env.NODE_ENV = 'development';
      mockSend.mockRejectedValue(new Error('SendGrid error'));

      const result = await sendEmailOTP({
        to: 'test@example.com',
        otpCode: '123456',
        purpose: 'signup',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('sendSMSOTP', () => {
    it('should send SMS OTP with correct format', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+15551234567';
      mockCreate.mockResolvedValue({ sid: 'SM123', status: 'queued' });

      const result = await sendSMSOTP({
        to: '+15559876543',
        otpCode: '123456',
        purpose: 'login',
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+15559876543',
          body: expect.stringContaining('123456'),
        })
      );
    });

    it('should reject invalid phone number format', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+15551234567';

      const result = await sendSMSOTP({
        to: '1234567890', // Missing + prefix
        otpCode: '123456',
        purpose: 'login',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('E.164 format');
    });

    it('should use messaging service SID when available', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_MESSAGING_SERVICE_SID = 'MG123';
      mockCreate.mockResolvedValue({ sid: 'SM123', status: 'queued' });

      const result = await sendSMSOTP({
        to: '+15559876543',
        otpCode: '123456',
        purpose: 'login',
      });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messagingServiceSid: 'MG123',
        })
      );
    });

    it('should handle Twilio specific error codes', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+15551234567';
      process.env.NODE_ENV = 'production';

      const twilioError = new Error('Twilio error');
      (twilioError as any).code = 21211;
      mockCreate.mockRejectedValue(twilioError);

      const result = await sendSMSOTP({
        to: '+15559876543',
        otpCode: '123456',
        purpose: 'login',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });
  });

  describe('sendOTP', () => {
    it('should detect email and send via email', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';
      mockSend.mockResolvedValue([{ statusCode: 202 }]);

      const result = await sendOTP('test@example.com', '123456', 'signup');

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should detect phone number and send via SMS', async () => {
      process.env.TWILIO_ACCOUNT_SID = 'test-sid';
      process.env.TWILIO_AUTH_TOKEN = 'test-token';
      process.env.TWILIO_PHONE_NUMBER = '+15551234567';
      mockCreate.mockResolvedValue({ sid: 'SM123' });

      const result = await sendOTP('+15559876543', '123456', 'login');

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should reject invalid target format', async () => {
      const result = await sendOTP('invalid-target', '123456', 'signup');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid target format');
    });
  });
});
