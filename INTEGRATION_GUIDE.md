# Blood Donation System - Full Stack Integration Guide

This guide explains how to set up and run the complete Blood Donation System with both frontend and backend components.

## 🏗️ Architecture Overview

```
┌─────────────────┐     HTTP/REST API     ┌─────────────────┐     ┌─────────────────┐
│                 │ ◄──────────────────► │                 │ ◄──► │                 │
│   React.js      │                      │   Node.js       │     │   MongoDB       │
│   Frontend      │                      │   Backend       │     │   Database      │
│   (Port 5173)   │                      │   (Port 5000)   │     │   (Port 27017)  │
│                 │                      │                 │     │                 │
└─────────────────┘                      └─────────────────┘     └─────────────────┘
```

## 📁 Project Structure

```
project-bolt-sb1-wcaixroz/
├── project/                 # Frontend (React + TypeScript + Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/        # AuthContext (updated for backend)
│   │   ├── lib/
│   │   │   ├── apiService.ts    # Backend API integration
│   │   │   └── supabase.ts      # Legacy (can be removed)
│   │   └── ...
│   ├── package.json
│   └── .env
├── backend/                 # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Entry point
│   ├── package.json
│   └── .env
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB v5.0+
- npm or yarn

### 1. Start MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongod

# macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Backend will run on: http://localhost:5000

### 3. Setup Frontend
```bash
cd project
npm install
# Edit .env to point to backend
npm run dev
```

Frontend will run on: http://localhost:5173

## 🔧 Configuration

### Backend Configuration (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blood_donation_db
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Configuration (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🔄 API Integration

The frontend uses a centralized API service (`src/lib/apiService.ts`) to communicate with the backend:

### Authentication Flow
1. User registers/logs in through frontend
2. Frontend sends credentials to backend API
3. Backend validates and returns JWT token
4. Frontend stores token and uses it for authenticated requests
5. Backend validates JWT for protected routes

### Key Features Integrated
- ✅ User authentication (register, login, logout)
- ✅ Donor registration and management
- ✅ Blood request creation and management
- ✅ Geospatial search for nearby donors/requests
- ✅ Certificate generation and verification
- ✅ Email notifications
- ✅ File uploads (avatars, documents)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Donors
- `POST /api/donors/register` - Register as donor
- `GET /api/donors` - Get donors list
- `GET /api/donors/nearby` - Find nearby donors
- `PUT /api/donors/profile` - Update donor profile

### Blood Requests
- `POST /api/requests` - Create blood request
- `GET /api/requests` - Get blood requests
- `GET /api/requests/nearby` - Find nearby requests
- `POST /api/requests/:id/respond` - Respond to request

### Certificates
- `GET /api/certificates/my-certificates` - Get user certificates
- `GET /api/certificates/verify/:code` - Verify certificate
- `POST /api/donations/:id/generate-certificate` - Generate certificate

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (user/admin),
  isEmailVerified: Boolean,
  address: Object,
  location: GeoJSON Point,
  createdAt: Date
}
```

### Donors Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  bloodType: String,
  age: Number,
  weight: Number,
  isAvailable: Boolean,
  location: GeoJSON Point,
  medicalHistory: Object,
  donationCount: Number,
  createdAt: Date
}
```

### Blood Requests Collection
```javascript
{
  _id: ObjectId,
  requester: ObjectId (ref: User),
  patientName: String,
  bloodType: String,
  unitsNeeded: Number,
  urgency: String,
  hospital: Object,
  location: GeoJSON Point,
  status: String,
  responses: Array,
  createdAt: Date
}
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Input validation with Joi
- CORS protection
- Helmet security headers
- MongoDB injection protection

## 📧 Email System

Automated emails are sent for:
- Account verification
- Password reset
- Blood request notifications
- Certificate generation
- Donation confirmations

## 🗺️ Geospatial Features

- MongoDB geospatial queries for location-based search
- Find nearby donors within specified radius
- Location-based blood request matching
- Distance calculations

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Blood Donation API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Frontend-Backend Integration Test
1. Open http://localhost:5173
2. Try to register a new user
3. Check browser network tab for API calls
4. Verify data is stored in MongoDB

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use PM2 for process management
3. Set up reverse proxy (Nginx)
4. Configure MongoDB Atlas or production MongoDB
5. Set up SSL certificates

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to Vercel, Netlify, or AWS S3
3. Update VITE_API_BASE_URL to production backend URL

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in backend/.env
   - Verify firewall settings

2. **CORS Error**
   - Check FRONTEND_URL in backend/.env
   - Ensure frontend URL matches CORS configuration

3. **JWT Token Issues**
   - Verify JWT_SECRET is set in backend/.env
   - Check token expiration settings
   - Clear browser localStorage if needed

4. **Email Not Sending**
   - Verify SMTP credentials in backend/.env
   - Check firewall and port settings
   - Use app-specific passwords for Gmail

### Debug Commands

```bash
# Check MongoDB status
sudo systemctl status mongod

# View backend logs
cd backend && npm run dev

# View frontend logs
cd project && npm run dev

# Test API directly
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123","phone":"1234567890"}'
```

## 📊 Performance Considerations

- Database indexing for geospatial queries
- API response caching
- Image optimization for avatars
- Pagination for large datasets
- Connection pooling for MongoDB

## 🔄 Migration from Supabase

The frontend originally used Supabase but has been updated to use the custom backend:

1. AuthContext updated to use apiService
2. Database operations migrated to REST API calls
3. File uploads can be handled by backend or cloud service
4. Real-time features can be implemented with WebSockets

## 📈 Future Enhancements

- Real-time notifications with WebSockets
- Mobile app with React Native
- Advanced analytics dashboard
- Integration with hospital systems
- Blockchain for donation records
- AI-powered donor-recipient matching

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Check server logs for errors
- Verify environment configuration

---

🩸 **Together, we save lives through technology!** 🩸
