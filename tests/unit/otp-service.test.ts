import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockStorage = {
  createOTP: vi.fn(),
  getOTP: vi.fn(),
  updateOTP: vi.fn(),
  deleteOTP: vi.fn(),
};

const mockSendGrid = {
  send: vi.fn(),
};

const mockTwilio = {
  messages: {
    create: vi.fn(),
  },
};

vi.mock('../../server/storage', () => ({
  storage: mockStorage,
}));

vi.mock('@sendgrid/mail', () => ({
  default: mockSendGrid,
  setApiKey: vi.fn(),
}));

vi.mock('twilio', () => ({
  default: vi.fn(() => mockTwilio),
}));

describe('OTP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OTP Generation', () => {
    it('should generate 6-digit OTP code', async () => {
      mockStorage.createOTP.mockResolvedValue({
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.generateOTP('user@example.com', 'signup');

      expect(result.code).toMatch(/^\d{6}$/);
      expect(mockStorage.createOTP).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'user@example.com',
          purpose: 'signup',
          code: expect.stringMatching(/^\d{6}$/),
        })
      );
    });

    it('should set expiration to 10 minutes', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      mockStorage.createOTP.mockResolvedValue({
        id: '1',
        code: '123456',
        expiresAt: new Date('2024-01-15T10:10:00Z'),
      });

      const { otpService } = await import('../../server/services/otpService');
      
      await otpService.generateOTP('user@example.com', 'signup');

      const createCall = mockStorage.createOTP.mock.calls[0][0];
      const expectedExpiry = new Date('2024-01-15T10:10:00Z');
      
      expect(createCall.expiresAt).toEqual(expectedExpiry);
    });

    it('should support different purposes (signup, reset, login)', async () => {
      mockStorage.createOTP.mockResolvedValue({ id: '1', code: '123456' });

      const { otpService } = await import('../../server/services/otpService');

      await otpService.generateOTP('user@example.com', 'signup');
      await otpService.generateOTP('user@example.com', 'reset');
      await otpService.generateOTP('user@example.com', 'login');

      expect(mockStorage.createOTP).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ purpose: 'signup' })
      );
      expect(mockStorage.createOTP).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ purpose: 'reset' })
      );
      expect(mockStorage.createOTP).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ purpose: 'login' })
      );
    });
  });

  describe('Email OTP Delivery', () => {
    it('should send OTP via email', async () => {
      mockSendGrid.send.mockResolvedValue([{ statusCode: 202 }]);

      const { otpService } = await import('../../server/services/otpService');
      
      await otpService.sendEmailOTP('user@example.com', '123456', 'signup');

      expect(mockSendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('verification'),
          text: expect.stringContaining('123456'),
          html: expect.stringContaining('123456'),
        })
      );
    });

    it('should use different email templates for different purposes', async () => {
      mockSendGrid.send.mockResolvedValue([{ statusCode: 202 }]);

      const { otpService } = await import('../../server/services/otpService');

      await otpService.sendEmailOTP('user@example.com', '123456', 'signup');
      expect(mockSendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('verification'),
        })
      );

      await otpService.sendEmailOTP('user@example.com', '654321', 'reset');
      expect(mockSendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('reset'),
        })
      );
    });

    it('should handle email sending errors', async () => {
      mockSendGrid.send.mockRejectedValue(new Error('SendGrid error'));

      const { otpService } = await import('../../server/services/otpService');

      await expect(
        otpService.sendEmailOTP('user@example.com', '123456', 'signup')
      ).rejects.toThrow('SendGrid error');
    });
  });

  describe('SMS OTP Delivery', () => {
    it('should send OTP via SMS', async () => {
      mockTwilio.messages.create.mockResolvedValue({ sid: 'SM123' });

      const { otpService } = await import('../../server/services/otpService');
      
      await otpService.sendSMSOTP('+1234567890', '123456', 'login');

      expect(mockTwilio.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('123456'),
        to: '+1234567890',
        from: expect.any(String),
      });
    });

    it('should format phone numbers correctly', async () => {
      mockTwilio.messages.create.mockResolvedValue({ sid: 'SM123' });

      const { otpService } = await import('../../server/services/otpService');
      
      await otpService.sendSMSOTP('1234567890', '123456', 'login');

      expect(mockTwilio.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.stringMatching(/^\+?\d+$/),
        })
      );
    });

    it('should handle SMS sending errors', async () => {
      mockTwilio.messages.create.mockRejectedValue(new Error('Twilio error'));

      const { otpService } = await import('../../server/services/otpService');

      await expect(
        otpService.sendSMSOTP('+1234567890', '123456', 'login')
      ).rejects.toThrow('Twilio error');
    });
  });

  describe('OTP Verification', () => {
    it('should verify correct OTP', async () => {
      const validOTP = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes future
        createdAt: new Date(),
      };

      mockStorage.getOTP.mockResolvedValue([validOTP]);
      mockStorage.deleteOTP.mockResolvedValue(undefined);

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.verifyOTP('user@example.com', '123456', 'signup');

      expect(result.valid).toBe(true);
      expect(mockStorage.deleteOTP).toHaveBeenCalledWith('1');
    });

    it('should reject incorrect OTP', async () => {
      const otp = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockStorage.getOTP.mockResolvedValue([otp]);
      mockStorage.updateOTP.mockResolvedValue(undefined);

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.verifyOTP('user@example.com', '654321', 'signup');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid OTP code');
      expect(mockStorage.updateOTP).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ attempts: 1 })
      );
    });

    it('should reject expired OTP', async () => {
      const expiredOTP = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        attempts: 0,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      mockStorage.getOTP.mockResolvedValue([expiredOTP]);
      mockStorage.deleteOTP.mockResolvedValue(undefined);

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.verifyOTP('user@example.com', '123456', 'signup');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('OTP has expired');
      expect(mockStorage.deleteOTP).toHaveBeenCalledWith('1');
    });

    it('should lock OTP after max attempts (5)', async () => {
      const otp = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        attempts: 4,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockStorage.getOTP.mockResolvedValue([otp]);
      mockStorage.updateOTP.mockResolvedValue(undefined);
      mockStorage.deleteOTP.mockResolvedValue(undefined);

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.verifyOTP('user@example.com', '654321', 'signup');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Too many attempts');
      expect(mockStorage.deleteOTP).toHaveBeenCalledWith('1');
    });

    it('should only verify OTP with matching purpose', async () => {
      const otp = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockStorage.getOTP.mockResolvedValue([otp]);

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.verifyOTP('user@example.com', '123456', 'reset');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('OTP not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should prevent generating OTP too frequently', async () => {
      const recentOTP = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        createdAt: new Date(Date.now() - 30 * 1000), // 30 seconds ago
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockStorage.getOTP.mockResolvedValue([recentOTP]);

      const { otpService } = await import('../../server/services/otpService');
      
      await expect(
        otpService.generateOTP('user@example.com', 'signup')
      ).rejects.toThrow(/wait.*before requesting/i);
    });

    it('should allow generating OTP after cooldown period', async () => {
      const oldOTP = {
        id: '1',
        target: 'user@example.com',
        code: '123456',
        purpose: 'signup',
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        expiresAt: new Date(Date.now() + 8 * 60 * 1000),
      };

      mockStorage.getOTP.mockResolvedValue([oldOTP]);
      mockStorage.createOTP.mockResolvedValue({
        id: '2',
        code: '654321',
      });

      const { otpService } = await import('../../server/services/otpService');
      
      const result = await otpService.generateOTP('user@example.com', 'signup');

      expect(result.code).toBeTruthy();
      expect(mockStorage.createOTP).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should delete expired OTPs', async () => {
      const { otpService } = await import('../../server/services/otpService');
      
      await otpService.cleanupExpiredOTPs();

      expect(mockStorage.deleteOTP).toHaveBeenCalled();
    });
  });
});
