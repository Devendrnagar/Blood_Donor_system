import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load environment variables
dotenv.config();

const debugLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'itsdhakad18@gmail.com';
    const password = 'admin123';

    // Check if user exists
    console.log('1. Checking if user exists...');
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      
      // Let's create a test user
      console.log('Creating test user...');
      const testUser = await User.create({
        fullName: 'Test Admin',
        email: email,
        password: password,
        phone: '+1234567890',
        role: 'admin',
        isEmailVerified: true,
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India'
        }
      });
      console.log('✅ Test user created:', testUser.email);
    } else {
      console.log('✅ User found:', user.email, 'Role:', user.role);
      console.log('   Active:', user.isActive);
      console.log('   Email Verified:', user.isEmailVerified);
      
      // Now test password comparison
      console.log('2. Testing password comparison...');
      console.log('   Stored password hash:', user.password);
      
      // Get user with password included
      const userWithPassword = await User.findOne({ email }).select('+password');
      console.log('   User with password:', !!userWithPassword.password);
      
      try {
        const isMatch = await userWithPassword.matchPassword(password);
        console.log('   Password match result:', isMatch);
        
        // Also test direct bcrypt comparison
        const directMatch = await bcrypt.compare(password, userWithPassword.password);
        console.log('   Direct bcrypt match:', directMatch);
        
      } catch (passError) {
        console.error('   Password comparison error:', passError);
      }
    }

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

debugLogin();
