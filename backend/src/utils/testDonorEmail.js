import dotenv from 'dotenv';
import { sendDonorRegistrationConfirmation } from './emailService.js';

// Load environment variables
dotenv.config();

const testDonorRegistrationEmail = async () => {
  try {
    console.log('🔧 Testing donor registration confirmation email...');
    
    // Mock user and donor data
    const mockUser = {
      fullName: 'John Doe',
      email: process.env.SMTP_USER || process.env.EMAIL_USER || 'test@example.com'
    };
    
    const mockDonor = {
      bloodType: 'O+',
      age: 25,
      address: {
        city: 'Mumbai',
        state: 'Maharashtra'
      }
    };
    
    const result = await sendDonorRegistrationConfirmation(mockUser, mockDonor);
    
    console.log('✅ Donor registration confirmation email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Sent to:', mockUser.email);
  } catch (error) {
    console.error('❌ Donor registration email test failed:', error);
  }
};

testDonorRegistrationEmail();
