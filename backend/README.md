# Blood Donation Backend API

A comprehensive Node.js backend API for the Blood Donation System built with Express.js and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user profiles with email verification
- **Donor Management**: Donor registration, verification, and availability tracking
- **Blood Requests**: Create, manage, and respond to blood donation requests
- **Donation Tracking**: Complete donation lifecycle management
- **Certificate Generation**: Automated certificate generation for donations
- **Geospatial Search**: Find nearby donors and requests using MongoDB geospatial queries
- **Email Notifications**: Automated email notifications for various events
- **API Documentation**: RESTful API with comprehensive error handling
- **Security**: Rate limiting, input validation, and security best practices

## 🛠️ Technology Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Email**: Nodemailer
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer
- **PDF Generation**: Puppeteer
- **Image Processing**: Cloudinary
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blood_donation_db
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   EMAIL_FROM=noreply@blooddonation.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   
   # Using the provided script
   ./start.sh
   ```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/verify-email/:token` - Verify email

### Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/search` - Search users
- `GET /api/users/stats` - Get user statistics

### Donors
- `POST /api/donors/register` - Register as donor
- `GET /api/donors` - Get all donors
- `GET /api/donors/:id` - Get donor by ID
- `GET /api/donors/nearby` - Find nearby donors
- `GET /api/donors/profile/me` - Get own donor profile
- `PUT /api/donors/profile` - Update donor profile
- `PUT /api/donors/availability` - Update availability
- `DELETE /api/donors/profile` - Delete donor profile
- `GET /api/donors/search` - Search donors
- `GET /api/donors/stats` - Get donor statistics

### Blood Requests
- `POST /api/requests` - Create blood request
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get request by ID
- `GET /api/requests/nearby` - Find nearby requests
- `GET /api/requests/user/my-requests` - Get user's requests
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request
- `POST /api/requests/:id/respond` - Respond to request
- `GET /api/requests/:id/responses` - Get request responses
- `GET /api/requests/search` - Search requests
- `GET /api/requests/stats` - Get request statistics

### Donations (Admin/Owner)
- `POST /api/donations` - Create donation record
- `GET /api/donations` - Get all donations
- `GET /api/donations/:id` - Get donation by ID
- `GET /api/donations/my-donations` - Get user's donations
- `PUT /api/donations/:id` - Update donation
- `DELETE /api/donations/:id` - Delete donation
- `PUT /api/donations/:id/complete` - Complete donation
- `PUT /api/donations/:id/test-results` - Add test results
- `POST /api/donations/:id/generate-certificate` - Generate certificate
- `GET /api/donations/stats` - Get donation statistics

### Certificates
- `GET /api/certificates` - Get certificates
- `GET /api/certificates/:id` - Get certificate by ID
- `GET /api/certificates/my-certificates` - Get user's certificates
- `GET /api/certificates/:id/download` - Download certificate
- `GET /api/certificates/verify/:code` - Verify certificate (Public)
- `POST /api/certificates/:id/regenerate` - Regenerate certificate
- `POST /api/certificates/:id/share` - Share certificate
- `GET /api/certificates/stats` - Get certificate statistics

### Health Check
- `GET /health` - Health check endpoint

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management
│   │   ├── donorController.js   # Donor management
│   │   ├── requestController.js # Blood request management
│   │   ├── donationController.js # Donation management
│   │   ├── certificateController.js # Certificate management
│   │   └── profileController.js # Profile management
│   ├── middleware/
│   │   ├── authMiddleware.js    # Authentication middleware
│   │   ├── errorMiddleware.js   # Error handling
│   │   └── validationMiddleware.js # Input validation
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Donor.js            # Donor model
│   │   ├── BloodRequest.js     # Blood request model
│   │   ├── Donation.js         # Donation model
│   │   └── Certificate.js      # Certificate model
│   ├── routes/
│   │   ├── authRoutes.js       # Auth routes
│   │   ├── userRoutes.js       # User routes
│   │   ├── donorRoutes.js      # Donor routes
│   │   ├── requestRoutes.js    # Request routes
│   │   ├── donationRoutes.js   # Donation routes
│   │   ├── certificateRoutes.js # Certificate routes
│   │   └── profileRoutes.js    # Profile routes
│   ├── utils/
│   │   ├── tokenUtils.js       # JWT utilities
│   │   └── emailService.js     # Email service
│   └── server.js               # Application entry point
├── .env.example                # Environment variables example
├── .gitignore                  # Git ignore file
├── package.json                # Dependencies and scripts
├── start.sh                    # Start script
└── README.md                   # This file
```

## 🗄️ Database Schema

### Users Collection
- Personal information and authentication
- Role-based access control
- Email verification and password reset

### Donors Collection
- Medical information and eligibility
- Location and availability tracking
- Donation history and statistics

### Blood Requests Collection
- Patient and hospital information
- Urgency levels and requirements
- Geographic location for matching

### Donations Collection
- Complete donation lifecycle
- Medical screening and test results
- Certificate generation tracking

### Certificates Collection
- Digital certificates for donations
- QR codes for verification
- Sharing and download tracking

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation using Joi
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Protection**: Cross-origin request protection
- **Helmet Security**: Security headers
- **Environment Variables**: Secure configuration management

## 📧 Email Integration

The system sends automated emails for:
- Account verification
- Password reset
- Blood request notifications to donors
- Request confirmations
- Certificate generation notifications

## 🗺️ Geospatial Features

- **Nearby Search**: Find donors and requests within specified radius
- **Location-based Matching**: Automatic donor notification based on location
- **Distance Calculations**: MongoDB geospatial queries for efficient matching

## 🚦 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [
      // Validation errors if applicable
    ]
  }
}
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check API health
curl http://localhost:5000/health
```

## 🚀 Deployment

### Production Environment Setup

1. **Environment Variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=strong_production_secret
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name "blood-donation-api"
   pm2 startup
   pm2 save
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 🔧 Configuration

### MongoDB Indexes
The application automatically creates necessary indexes for:
- Geospatial queries on location fields
- Unique constraints on email and verification codes
- Compound indexes for efficient filtering

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Email Not Sending**
   - Check SMTP configuration
   - Verify email credentials
   - Check spam folder

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format

## 📚 Documentation

For detailed API documentation, import the Postman collection or use tools like Swagger UI with the OpenAPI specification.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Email: support@blooddonation.com

---

Built with ❤️ for saving lives through blood donation.
