#!/bin/bash

# Blood Donation Backend Setup Script
echo "🩸 Blood Donation Backend Setup"
echo "=============================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "📋 Creating .env file from .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created successfully!"
        echo ""
        echo "⚠️  IMPORTANT: Please edit the .env file and set the following required variables:"
        echo "   - MONGODB_URI (MongoDB connection string)"
        echo "   - JWT_SECRET (A secure random string)"
        echo ""
        echo "💡 For local development, you can use:"
        echo "   MONGODB_URI=mongodb://localhost:27017/blood-donation-system"
        echo ""
        echo "🔧 After updating .env, run: npm run dev"
    else
        echo "❌ .env.example not found. Please create a .env file manually."
        exit 1
    fi
else
    echo "✅ .env file exists"
    
    # Check if MONGODB_URI is set
    if grep -q "^MONGODB_URI=" .env && ! grep -q "^MONGODB_URI=$" .env; then
        echo "✅ MONGODB_URI is configured"
    else
        echo "⚠️  MONGODB_URI is not configured in .env file"
        echo "   Please set your MongoDB connection string"
    fi
    
    echo ""
    echo "🚀 Starting the application..."
    npm run dev
fi
