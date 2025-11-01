# Blood Donor Certificate System

A comprehensive Blood Donation Management System with automatic certificate generation, verification, and management features. Built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### 🩸 Core Blood Donation System
- **Donor Registration**: Complete donor profiles with location mapping
- **Blood Request Management**: Request blood with urgency levels
- **Donor Discovery**: Find nearby donors by blood type and location
- **Interactive Map**: Visual representation of donors and requests

### 🏆 Certificate Management System
- **Automatic Certificate Generation**: PDF certificates generated upon donation
- **Government-style Design**: Official Indian Government branding and layout
- **QR Code Verification**: Each certificate includes a unique QR code
- **Multi-language Support**: Hindi and English text
- **Digital Signatures**: Authorized signatory information

### 📧 Communication System
- **Email Notifications**: Automatic email with certificate attachment
- **SMS Notifications**: Optional SMS alerts with verification links
- **Resend Capabilities**: Admin can resend failed notifications

### 🔒 Security & Verification
- **Public Verification**: Anyone can verify certificates online
- **Unique Certificate IDs**: Human-readable format (BDC-2025-000123)
- **Rate Limiting**: Prevents verification endpoint abuse
- **Audit Trail**: Complete logging of downloads and verifications

### 👥 User Features
- **Personal Dashboard**: View donation history and certificates
- **Certificate Download**: PDF download with official formatting
- **Certificate Sharing**: Share verification URLs easily
- **Statistics Tracking**: Personal donation statistics

### 🔧 Admin Features
- **Certificate Management**: View, revoke, and reissue certificates
- **Audit Logs**: Track all certificate activities
- **Email Management**: Monitor and resend email notifications
- **Statistics Dashboard**: System-wide analytics

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: jsPDF + html2canvas
- **QR Codes**: qrcode + react-qr-code
- **Maps**: Google Maps API
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Google Maps API key (optional, for maps)

### 1. Clone and Install Dependencies

```bash
cd project
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the database migrations:
   - Execute `/supabase/migrations/20251101044405_create_blood_donation_tables.sql`
   - Execute `/supabase/migrations/20251101050000_create_certificate_tables.sql`

3. Set up your environment variables in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Database Configuration

The system includes the following main tables:
- `profiles` - User profiles
- `donors` - Donor information
- `blood_requests` - Blood requests
- `donation_centers` - Donation centers
- `blood_donations` - Donation records
- `blood_certificates` - Certificate metadata

### 4. Google Maps API Setup (Optional)

For map functionality, you'll need a Google Maps API key:

1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Add the key to your `.env` file:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Note**: The Google Maps integration has been updated to use the new `AdvancedMarkerElement` API to resolve deprecation warnings. See `GOOGLE_MAPS_SETUP.md` for detailed setup instructions.

### 5. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage Guide

### For Donors

1. **Register/Login**: Create an account and complete your profile
2. **Become a Donor**: Fill out the donor registration form
3. **Record Donations**: After donating blood, record your donation
4. **Get Certificate**: Automatic certificate generation with PDF download
5. **Manage Certificates**: View, download, and share your certificates

### For Blood Seekers

1. **Find Donors**: Search for donors by blood type and location
2. **Create Requests**: Post blood requests with urgency levels
3. **View Map**: See nearby donors on an interactive map

### For Administrators

1. **Certificate Management**: Monitor all certificates in the system
2. **Revoke Certificates**: Revoke invalid certificates with reasons
3. **Email Management**: Resend failed email notifications
4. **Audit Logs**: View download and verification statistics

### Certificate Verification

Anyone can verify certificates by:
1. Scanning the QR code on the certificate
2. Visiting `/verify/{certificateID}` URL
3. Entering certificate ID on the verification page

## API Endpoints

### Certificate APIs
- `GET /api/certificate/verify/:certificateID` - Public certificate verification
- `GET /api/certificates/:certificateID` - Get certificate details
- `POST /api/donations` - Create donation and generate certificate
- `POST /api/certificates/resend` - Resend certificate email

### Certificate Features

#### PDF Certificate Includes:
- Government of India official header with emblem
- Donor details (name, age, blood type, contact)
- Donation details (date, center, blood unit ID)
- Official statement in Hindi and English
- Unique certificate ID and QR code
- Authorized signatory details
- Verification instructions and contact info

#### Certificate Security:
- Unique, human-readable certificate IDs
- QR codes with verification URLs
- Digital audit trail
- Revocation capabilities
- Rate-limited verification endpoints

## Email Template

The system sends beautifully formatted HTML emails containing:
- Welcome message and congratulations
- Certificate details and download links
- QR code for verification
- Important donation aftercare information
- Government branding and contact information

## Verification Process

1. **QR Code**: Scan to instantly verify certificate
2. **Manual Entry**: Enter certificate ID on verification page
3. **Public API**: Programmatic verification via REST API
4. **Audit Trail**: All verifications are logged with timestamps

## Security Features

- **Row Level Security**: Supabase RLS policies protect data
- **Authentication**: Secure user authentication via Supabase
- **Data Validation**: Frontend and database validation
- **Rate Limiting**: Prevents abuse of verification endpoints
- **Audit Logging**: Complete activity tracking

## Compliance Features

- **GDPR Ready**: Privacy-compliant data handling
- **Indian Government Standards**: Official branding and format
- **Accessibility**: WCAG compliant design
- **Multi-language**: Hindi and English support

## Development

### Adding New Features

1. **Database Changes**: Create new migration files in `/supabase/migrations/`
2. **Components**: Add new React components in `/src/components/`
3. **Services**: Add business logic in `/src/lib/`
4. **Types**: Update TypeScript interfaces in service files

### Testing

Run the development server and test:
1. User registration and donor profile creation
2. Blood donation recording and certificate generation
3. Certificate download and verification
4. Admin certificate management
5. Email notification system

## Production Deployment

### Environment Setup
- Configure production Supabase instance
- Set up email service (SendGrid/AWS SES)
- Configure SMS service (for notifications)
- Set up file storage for PDF certificates
- Configure domain for verification URLs

### Security Considerations
- Enable rate limiting on verification endpoints
- Set up monitoring and logging
- Configure backup strategies
- Implement proper SSL/TLS
- Set up domain validation for emails

## Support

For technical support or questions:
- Email: support@blooddonation.gov.in
- Helpline: 1075
- Documentation: Check this README and code comments

## License

This project is developed for the Government of India blood donation initiative. Please ensure compliance with all applicable regulations and guidelines.

---

**भारत सरकार | Government of India**
**रक्तदान महादान - आपका यह नेक कार्य किसी की जिंदगी बचा सकता है**
