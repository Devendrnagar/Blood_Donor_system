import dotenv from 'dotenv';
import { sendEmail } from './emailService.js';

// Load environment variables
dotenv.config();

const testEmail = async () => {
  try {
    console.log('🔧 Testing email configuration...');
    console.log('Email Host:', process.env.SMTP_HOST || process.env.EMAIL_HOST);
    console.log('Email Port:', process.env.SMTP_PORT || process.env.EMAIL_PORT);
    console.log('Email User:', process.env.SMTP_USER || process.env.EMAIL_USER);
    console.log('Password set:', (process.env.SMTP_PASS || process.env.EMAIL_PASS) ? 'Yes' : 'No');
    
    const result = await sendEmail({
      email: process.env.SMTP_USER || process.env.EMAIL_USER || 'test@example.com',
      subject: 'Blood Donation System - Email Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email to verify the email service is working correctly.</p>
        <p>Date: ${new Date().toISOString()}</p>
        <p>If you receive this email, the configuration is working! 🎉</p>
      `,
      text: 'Email configuration test - if you receive this, it\'s working!'
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n📋 Email Authentication Issues:');
      console.log('1. Make sure you\'re using an App Password, not your regular Gmail password');
      console.log('2. Enable 2-factor authentication on your Gmail account');
      console.log('3. Generate an App Password: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n📋 Network Issues:');
      console.log('1. Check your internet connection');
      console.log('2. Verify SMTP server settings');
    }
  }
};

testEmail();
