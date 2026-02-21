/**
 * Gmail SMTP Connection Test Script
 * 
 * Run this to verify your Gmail SMTP configuration is working
 * 
 * Usage:
 *   npx ts-node test-gmail-smtp.ts
 */

import * as nodemailer from 'nodemailer';

// Load environment variables from .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line: string) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

async function testGmailSMTP() {
  console.log('🔧 Testing Gmail SMTP Configuration...\n');

  // Check environment variables
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;

  console.log('📋 Configuration:');
  console.log(`   SMTP_HOST: ${smtpHost}`);
  console.log(`   SMTP_PORT: ${smtpPort}`);
  console.log(`   SMTP_USER: ${smtpUser}`);
  console.log(`   SMTP_PASS: ${smtpPass ? '***' + smtpPass.slice(-4) : 'NOT SET'}\n`);

  if (!smtpUser || !smtpPass) {
    console.error('❌ SMTP_USER or SMTP_PASS not configured in .env file');
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Test connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testOtp = '123456';
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || `"Library Management System" <${smtpUser}>`,
      to: smtpUser, // Send to yourself for testing
      subject: '🧪 Test Email - Gmail SMTP Working!',
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
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Gmail SMTP Test Successful!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">🎉 Configuration Working!</h2>
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your Gmail SMTP configuration is working correctly. The forgot password feature will now send OTP emails successfully.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center" style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 30px;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Test OTP</p>
                            <p style="color: #4f46e5; font-size: 42px; font-weight: bold; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${testOtp}
                            </p>
                          </td>
                        </tr>
                      </table>
                      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px; padding: 15px; margin: 20px 0;">
                        <p style="color: #065f46; font-size: 14px; margin: 0; font-weight: 600;">
                          ✅ Your forgot password system is ready to use!
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                        Library Management System - Test Email
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
      text: `Gmail SMTP Test Successful!\n\nYour configuration is working correctly.\nTest OTP: ${testOtp}`,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Sent to: ${smtpUser}`);
    console.log(`\n🎉 Gmail SMTP is configured correctly!`);
    console.log(`\n📥 Check your inbox at: ${smtpUser}`);
    
  } catch (error: any) {
    console.error('\n❌ Gmail SMTP Test Failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   1. SMTP_USER is your correct Gmail address');
      console.error('   2. SMTP_PASS is a valid Google App Password (16 chars, no spaces)');
      console.error('   3. 2-Step Verification is enabled on your Google account');
      console.error('   4. Generate new App Password at: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n💡 Connection failed. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. Firewall settings');
      console.error('   3. Port 587 is not blocked');
    }
    
    process.exit(1);
  }
}

// Run the test
testGmailSMTP().catch(console.error);
