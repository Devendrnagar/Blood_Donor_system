#!/bin/bash

echo "🩸 Starting Blood Donation Backend..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   sudo systemctl start mongod"
    echo "   or"
    echo "   brew services start mongodb/brew/mongodb-community"
    exit 1
fi

echo "✅ MongoDB is running"

# Start the backend server
cd "$(dirname "$0")"
npm run dev
