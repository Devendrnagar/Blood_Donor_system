#!/bin/bash

# Blood Donation System - Start Script
echo "🩸 Starting Blood Donation System..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm to continue."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "🚀 Starting backend server..."
cd ../backend
npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

echo "📦 Installing frontend dependencies..."
cd ../project && npm install

echo "🎨 Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Blood Donation System is starting up!"
echo "🖥️  Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 API Health Check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to catch Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait
