# Blood Donation System - Node.js Backend Migration

## 🎉 Migration Complete!

This project has been successfully migrated from Supabase to use a full Node.js backend with MongoDB. The system now consists of:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB
- **Database**: MongoDB (replaces Supabase PostgreSQL)

## 🏗️ Project Structure

```
project-bolt-sb1-wcaixroz/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── lib/           # API services and utilities
│   │   └── ...
│   ├── package.json
│   └── .env               # Frontend environment variables
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── controllers/   # API controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # Express routes
│   │   ├── middleware/    # Custom middleware
│   │   └── ...
│   ├── package.json
│   └── .env              # Backend environment variables
└── start.sh              # Convenience script to start both servers
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### 1. Clone and Setup

```bash
cd /home/devendra/Downloads/project-bolt-sb1-wcaixroz
```

### 2. Configure Environment Variables

#### Backend (.env in /backend folder):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blood_donation_db
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
# ... other variables
```

#### Frontend (.env in /project folder):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Blood Donation System
```

### 3. Start the Application

#### Option 1: Use the convenience script
```bash
./start.sh
```

#### Option 2: Start manually

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd project
npm install
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🔄 What Changed in the Migration

### ✅ Removed
- `@supabase/supabase-js` dependency
- `supabase.ts` file
- `database.types.ts` (Supabase types)
- All Supabase-specific queries and operations
- Supabase migration files

### ✅ Updated
- **Authentication**: Now uses JWT tokens with the Node.js backend
- **API Calls**: All components now use `apiService` instead of direct Supabase calls
- **Data Flow**: Frontend → Node.js API → MongoDB (instead of Frontend → Supabase)
- **Environment Variables**: Updated to point to Node.js backend

### ✅ Enhanced
- **Certificate Service**: Updated to work with the Node.js API
- **Dashboard**: Now fetches data from the Node.js backend
- **API Service**: Added missing methods for full compatibility
- **Error Handling**: Improved error handling for API calls

## 🔧 Backend API Endpoints

The Node.js backend provides the following main endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Donors
- `GET /api/donors` - Get all donors
- `POST /api/donors` - Create donor profile
- `GET /api/donors/:id` - Get donor by ID
- `PUT /api/donors/:id` - Update donor
- `GET /api/donors/nearby` - Find nearby donors

### Blood Requests
- `GET /api/requests` - Get all requests
- `POST /api/requests` - Create blood request
- `GET /api/requests/:id` - Get request by ID
- `PUT /api/requests/:id` - Update request

### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Record new donation
- `GET /api/donations/:id` - Get donation by ID

### Certificates
- `GET /api/certificates` - Get all certificates
- `POST /api/certificates` - Create certificate
- `GET /api/certificates/:id` - Get certificate by ID
- `PUT /api/certificates/:id` - Update certificate

## 🛠️ Development

### Frontend Development
```bash
cd project
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

## 📊 Database Setup

The application uses MongoDB. Make sure you have MongoDB running:

### Local MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or if using brew on macOS
brew services start mongodb-community
```

### MongoDB Atlas (Cloud)
Update the `MONGODB_URI` in your backend `.env` file to your Atlas connection string.

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi

## 📝 Next Steps

1. **Configure MongoDB**: Ensure MongoDB is running and accessible
2. **Set JWT Secret**: Generate a secure JWT secret for production
3. **Update API URLs**: Configure proper API URLs for production deployment
4. **Test All Features**: Verify all functionality works with the new backend
5. **Deploy**: Deploy both frontend and backend to your preferred hosting service

## 🐛 Troubleshooting

### Common Issues

**1. Connection Error**
- Ensure MongoDB is running
- Check the `MONGODB_URI` in backend `.env`
- Verify network connectivity

**2. API Not Found**
- Check if backend server is running on port 5000
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check browser network tab for failed requests

**3. Authentication Issues**
- Clear browser localStorage
- Check JWT secret configuration
- Verify token expiration settings

### Getting Help

1. Check the browser console for frontend errors
2. Check backend logs for API errors
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

## 🎯 Success!

Your Blood Donation System is now running entirely on Node.js backend with MongoDB! The migration from Supabase is complete and the system is ready for development and deployment.
