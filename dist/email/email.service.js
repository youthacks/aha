"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const crypto = __importStar(require("crypto"));
let EmailService = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }
    async sendVerificationEmail(email, token, firstName) {
        const appUrl = this.configService.get('APP_URL');
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
            <h1>🎉 Welcome to AHA - Token System!</h1>
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
            <p>&copy; 2025 AHA - Token System. All rights reserved.</p>
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

- AHA - Token System Team
    `;
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM'),
                to: email,
                subject: 'Verify Your Email Address - AHA - Token System',
                text: textContent,
                html: htmlContent,
            });
            console.log(`✅ Verification email sent to: ${email}`);
        }
        catch (error) {
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
    async sendPasswordResetEmail(email, token, firstName) {
        const appUrl = this.configService.get('APP_URL');
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
                from: this.configService.get('SMTP_FROM'),
                to: email,
                subject: 'Reset Your Password - AHA - Token System',
                text: textContent,
                html: htmlContent,
            });
            console.log(`✅ Password reset email sent to: ${email}`);
        }
        catch (error) {
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
    generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    async sendEmailChangeVerification(newEmail, token, firstName) {
        const appUrl = this.configService.get('APP_URL');
        const verificationUrl = `${appUrl}/verify-email-change?token=${token}`;
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
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify Your New Email Address</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <p>You requested to change your email address. Please verify your new email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify New Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token-box">${verificationUrl}</div>
            <div class="warning">
              <strong>⚠️ Important:</strong><br>
              This link will expire in 1 hour.<br>
              If you didn't request this change, please ignore this email.
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

You requested to change your email address. Please verify your new email address by clicking the link below:

${verificationUrl}

This link will expire in 1 hour.

If you didn't request this change, please ignore this email.

- AHA - Token System Team
    `;
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM'),
                to: newEmail,
                subject: 'Verify Your New Email Address - AHA - Token System',
                text: textContent,
                html: htmlContent,
            });
            console.log(`✅ Email change verification sent to: ${newEmail}`);
        }
        catch (error) {
            console.error('❌ Error sending email change verification:', error);
            console.log('\n=================================');
            console.log('📧 EMAIL CHANGE VERIFICATION (Fallback)');
            console.log('=================================');
            console.log(`To: ${newEmail}`);
            console.log(`Verification URL: ${verificationUrl}`);
            console.log(`Token: ${token}`);
            console.log('=================================\n');
        }
    }
    async sendPasswordChangeConfirmation(email, token, firstName) {
        const appUrl = this.configService.get('APP_URL');
        const changeUrl = `${appUrl}/confirm-password-change?token=${token}`;
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
            <h1>🔒 Confirm Password Change</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName || 'there'},</p>
            <p>You requested to change your password. To continue, click the button below to set your new password:</p>
            <p style="text-align: center;">
              <a href="${changeUrl}" class="button">Confirm Password Change</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="token-box">${changeUrl}</div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour.<br>
              If you didn't request this change, someone may have access to your account. Please secure it immediately.
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

You requested to change your password. To continue, click the link below to set your new password:

${changeUrl}

This link will expire in 1 hour.

If you didn't request this change, someone may have access to your account. Please secure it immediately.

- AHA - Token System Team
    `;
        try {
            await this.transporter.sendMail({
                from: this.configService.get('SMTP_FROM'),
                to: email,
                subject: 'Confirm Password Change - AHA - Token System',
                text: textContent,
                html: htmlContent,
            });
            console.log(`✅ Password change confirmation sent to: ${email}`);
        }
        catch (error) {
            console.error('❌ Error sending password change confirmation:', error);
            console.log('\n=================================');
            console.log('📧 PASSWORD CHANGE CONFIRMATION (Fallback)');
            console.log('=================================');
            console.log(`To: ${email}`);
            console.log(`Confirmation URL: ${changeUrl}`);
            console.log(`Token: ${token}`);
            console.log('=================================\n');
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map