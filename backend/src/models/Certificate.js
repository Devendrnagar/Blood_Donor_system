import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  certificateType: {
    type: String,
    enum: ['donation', 'appreciation', 'milestone'],
    default: 'donation'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  donationDetails: {
    donationDate: {
      type: Date,
      required: true
    },
    bloodType: {
      type: String,
      required: true
    },
    volumeDonated: {
      type: Number,
      required: true
    },
    donationCenter: {
      name: String,
      city: String,
      state: String
    }
  },
  issuedBy: {
    organizationName: {
      type: String,
      default: 'Blood Donation Center'
    },
    officialName: String,
    designation: String,
    signature: String,
    seal: String
  },
  template: {
    templateId: {
      type: String,
      default: 'default'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    primaryColor: {
      type: String,
      default: '#e53e3e'
    },
    logoUrl: String,
    layoutType: {
      type: String,
      enum: ['classic', 'modern', 'elegant'],
      default: 'classic'
    }
  },
  qrCode: {
    data: String,
    imageUrl: String
  },
  verificationDetails: {
    verificationCode: {
      type: String,
      required: true
    },
    verificationUrl: String,
    isPubliclyVerifiable: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'revoked', 'expired'],
    default: 'issued'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null // null means no expiration
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  sharing: {
    isPubliclyShared: {
      type: Boolean,
      default: false
    },
    shareableLink: String,
    socialMediaShared: {
      facebook: { type: Boolean, default: false },
      twitter: { type: Boolean, default: false },
      linkedin: { type: Boolean, default: false },
      instagram: { type: Boolean, default: false }
    }
  },
  files: {
    pdfUrl: String,
    imageUrl: String,
    thumbnailUrl: String
  },
  metadata: {
    generatedBy: {
      type: String,
      default: 'system'
    },
    generationTime: Number, // Time taken to generate in milliseconds
    fileSize: Number, // Size in bytes
    version: {
      type: String,
      default: '1.0'
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_donation', 'regular_donor', 'life_saver', 'hero', 'champion']
    },
    title: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create indexes for efficient queries
certificateSchema.index({ certificateId: 1 }, { unique: true });
certificateSchema.index({ 'verificationDetails.verificationCode': 1 }, { unique: true });
certificateSchema.index({ donor: 1, generatedAt: -1 });
certificateSchema.index({ donation: 1 }, { unique: true });
certificateSchema.index({ status: 1 });

// Virtual for certificate age
certificateSchema.virtual('age').get(function() {
  const now = new Date();
  const generated = new Date(this.generatedAt);
  const diffTime = Math.abs(now - generated);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for expiry status
certificateSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
});

// Virtual for verification URL
certificateSchema.virtual('fullVerificationUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/verify/${this.verificationDetails.verificationCode}`;
});

// Method to increment download count
certificateSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Method to generate QR code data
certificateSchema.methods.generateQRCode = function() {
  const qrData = {
    certificateId: this.certificateId,
    verificationCode: this.verificationDetails.verificationCode,
    verificationUrl: this.fullVerificationUrl,
    donorName: this.donor.fullName,
    donationDate: this.donationDetails.donationDate,
    bloodType: this.donationDetails.bloodType
  };
  
  this.qrCode.data = JSON.stringify(qrData);
  return this.save();
};

// Static method to verify certificate
certificateSchema.statics.verifyCertificate = function(verificationCode) {
  return this.findOne({
    'verificationDetails.verificationCode': verificationCode,
    status: 'issued'
  }).populate('donor', 'fullName email')
    .populate('donation', 'donationDate bloodType volumeDonated');
};

// Static method to get certificate statistics
certificateSchema.statics.getStatistics = function(startDate, endDate) {
  const matchStage = {
    status: 'issued',
    generatedAt: {
      $gte: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        totalDownloads: { $sum: '$downloadCount' },
        avgDownloadsPerCertificate: { $avg: '$downloadCount' },
        certificateTypes: { $push: '$certificateType' }
      }
    }
  ]);
};

// Pre-save middleware to generate unique IDs
certificateSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate certificate ID if not provided
    if (!this.certificateId) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      this.certificateId = `CERT-${timestamp}-${random}`;
    }
    
    // Generate verification code if not provided
    if (!this.verificationDetails.verificationCode) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 8).toUpperCase();
      this.verificationDetails.verificationCode = `${timestamp}${random}`;
    }
  }
  next();
});

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
