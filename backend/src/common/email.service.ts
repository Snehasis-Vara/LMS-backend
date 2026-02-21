import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private etherealUser: string;
  private initPromise: Promise<void>;

  constructor() {
    // Start initialization immediately
    this.initPromise = this.initializeTransporter();
  }

  async onModuleInit() {
    // Wait for initialization to complete
    await this.initPromise;
  }

  private async initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Check if Gmail SMTP is configured
    if (smtpHost === 'smtp.gmail.com' && smtpUser && smtpPass) {
      this.logger.log('🔧 Initializing Gmail SMTP...');
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
          user: smtpUser,
          pass: smtpPass, // Google App Password
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });
      
      // Verify connection
      try {
        await this.transporter.verify();
        this.logger.log('✅ Gmail SMTP connection verified successfully!');
        this.logger.log(`📧 Emails will be sent from: ${smtpUser}`);
      } catch (error) {
        this.logger.error(`❌ Gmail SMTP verification failed: ${error.message}`);
        this.logger.error('Please check your SMTP_USER and SMTP_PASS (Google App Password)');
      }
    } else if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      this.logger.warn('⚠️  SMTP credentials not configured. Email sending will be simulated.');
      this.transporter = null;
    } else {
      // Use generic SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('✅ SMTP service initialized');
    }
  }

  async sendOTP(email: string, otp: string) {
    // Wait for initialization if not complete
    await this.initPromise;
    
    this.logger.log(`📧 Attempting to send OTP to: ${email}`);
    this.logger.log(`🔢 Generated OTP: ${otp}`);
    
    if (!this.transporter) {
      this.logger.error('❌ Email transporter not initialized!');
      this.logger.log(`[SIMULATED] OTP for ${email}: ${otp}`);
      this.logger.warn('Configure SMTP credentials in .env to enable real emails');
      throw new Error('Email service not configured. Please contact administrator.');
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || '"Library Management System" <noreply@lms.com>',
        to: email,
        subject: '🔐 Password Reset OTP - Library Management System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📚 Library Management System</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          You have requested to reset your password. Use the OTP code below to verify your identity:
                        </p>
                        
                        <!-- OTP Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center" style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 30px;">
                              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                              <p style="color: #4f46e5; font-size: 42px; font-weight: bold; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${otp}
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Warning -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 15px; margin: 20px 0;">
                          <tr>
                            <td>
                              <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 600;">
                                ⚠️ This OTP will expire in 5 minutes
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                          If you did not request this password reset, please ignore this email or contact support if you have concerns.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                          © ${new Date().getFullYear()} Library Management System. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `Password Reset OTP\n\nYour OTP code is: ${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
      };

      this.logger.log('📤 Sending email via Gmail SMTP...');
      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Email sent successfully!`);
      this.logger.log(`📬 Message ID: ${info.messageId}`);
      this.logger.log(`📧 Sent to: ${email}`);
      this.logger.log(`✉️  Response: ${info.response}`);
      
      return info;
    } catch (error) {
      this.logger.error(`❌ Failed to send email via Gmail SMTP`);
      this.logger.error(`Error: ${error.message}`);
      if (error.code) {
        this.logger.error(`Error Code: ${error.code}`);
      }
      this.logger.log(`[FALLBACK LOG] OTP for ${email}: ${otp}`);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }
}
