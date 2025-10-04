import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const verificationUrl = `${appUrl}/verify-email?email=${encodeURIComponent(email)}&token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .token-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; font-family: monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AHA-V2!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <p>Thank you for registering! Please verify your email address to complete your registration.</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token-box">${verificationUrl}</div>
            <p><strong>This verification link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AHA-V2. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hi ${firstName || 'there'},

Thank you for registering! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

- AHA-V2 Team
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: email,
        subject: 'Verify Your Email Address - AHA-V2',
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ Verification email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      console.log('\n=================================');
      console.log('📧 VERIFICATION EMAIL (Fallback - Email sending failed)');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log(`Token: ${token}`);
      console.log('=================================\n');
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL');
    const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .token-box { background: white; padding: 15px; border-left: 4px solid #f5576c; margin: 20px 0; font-family: monospace; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token-box">${resetUrl}</div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour.<br>
              If you didn't request a password reset, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2025 AHA - Token System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hi ${firstName || 'there'},

We received a request to reset your password. Click the link below to proceed:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

- AHA - Token System Team
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: email,
        subject: 'Reset Your Password - AHA - Token System',
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ Password reset email sent to: ${email}`);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      console.log('\n=================================');
      console.log('🔒 PASSWORD RESET EMAIL (Fallback - Email sending failed)');
      console.log('=================================');
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${token}`);
      console.log('=================================\n');
    }
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
