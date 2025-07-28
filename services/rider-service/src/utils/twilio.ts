// Twilio SMS Service
import { Twilio } from 'twilio';
import { env } from '../config/env';

class TwilioService {
  private client: Twilio | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Validate Twilio configuration
    const isValidConfig = this.validateTwilioConfig();
    
    if (isValidConfig) {
      try {
        this.client = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        this.isConfigured = true;
        console.log('✅ Twilio service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Twilio client:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  Twilio not configured properly - will use development mode');
      this.isConfigured = false;
    }
  }

  /**
   * Validate Twilio configuration
   */
  private validateTwilioConfig(): boolean {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      return false;
    }

    // Check if Account SID starts with 'AC' (Twilio requirement)
    if (!env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.error('❌ Invalid Twilio Account SID: Must start with "AC"');
      console.error('Current value:', env.TWILIO_ACCOUNT_SID);
      return false;
    }

    // Check if Auth Token is not a placeholder
    if (env.TWILIO_AUTH_TOKEN.includes('your_') || env.TWILIO_AUTH_TOKEN.length < 32) {
      console.error('❌ Invalid Twilio Auth Token: Appears to be a placeholder');
      return false;
    }

    // Check if Phone Number starts with '+'
    if (!env.TWILIO_PHONE_NUMBER.startsWith('+')) {
      console.error('❌ Invalid Twilio Phone Number: Must start with "+" and include country code');
      console.error('Current value:', env.TWILIO_PHONE_NUMBER);
      return false;
    }

    return true;
  }

  /**
   * Send OTP using Twilio
   */
  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; message: string; sid?: string }> {
    try {
      // In development mode, simulate success
      if (!this.isConfigured || !this.client) {
        console.log(`📱 Development mode - OTP for ${phone}: ${otp}`);
        return {
          success: true,
          message: 'OTP sent (development mode)',
          sid: 'dev_' + Date.now()
        };
      }

      // Validate phone number format
      if (!phone.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1234567890)');
      }

      // Send SMS using Twilio
      const message = await this.client.messages.create({
        body: `Your OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
        from: env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      return {
        success: true,
        message: 'OTP sent successfully',
        sid: message.sid
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        message: `SMS sending failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get health status with detailed configuration info
   */
  getHealthStatus() {
    const configStatus = {
      accountSid: !!env.TWILIO_ACCOUNT_SID && env.TWILIO_ACCOUNT_SID.startsWith('AC'),
      authToken: !!env.TWILIO_AUTH_TOKEN && env.TWILIO_AUTH_TOKEN.length >= 32,
      phoneNumber: !!env.TWILIO_PHONE_NUMBER && env.TWILIO_PHONE_NUMBER.startsWith('+')
    };

    return {
      configured: this.isConfigured,
      service: 'Twilio',
      ready: !!this.client,
      configurationStatus: configStatus,
      issues: this.getConfigurationIssues()
    };
  }

  /**
   * Get detailed configuration issues for troubleshooting
   */
  private getConfigurationIssues(): string[] {
    const issues: string[] = [];

    if (!env.TWILIO_ACCOUNT_SID) {
      issues.push('TWILIO_ACCOUNT_SID is missing');
    } else if (!env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      issues.push('TWILIO_ACCOUNT_SID must start with "AC"');
    } else if (env.TWILIO_ACCOUNT_SID.includes('your_')) {
      issues.push('TWILIO_ACCOUNT_SID appears to be a placeholder');
    }

    if (!env.TWILIO_AUTH_TOKEN) {
      issues.push('TWILIO_AUTH_TOKEN is missing');
    } else if (env.TWILIO_AUTH_TOKEN.length < 32) {
      issues.push('TWILIO_AUTH_TOKEN appears to be too short');
    } else if (env.TWILIO_AUTH_TOKEN.includes('your_')) {
      issues.push('TWILIO_AUTH_TOKEN appears to be a placeholder');
    }

    if (!env.TWILIO_PHONE_NUMBER) {
      issues.push('TWILIO_PHONE_NUMBER is missing');
    } else if (!env.TWILIO_PHONE_NUMBER.startsWith('+')) {
      issues.push('TWILIO_PHONE_NUMBER must start with "+" and include country code');
    }

    return issues;
  }
}

export const twilioService = new TwilioService();
