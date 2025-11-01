import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: true
  },
  donationDate: {
    type: Date,
    required: [true, 'Donation date is required']
  },
  volumeDonated: {
    type: Number,
    required: [true, 'Volume donated is required'],
    min: [350, 'Minimum donation volume is 350ml'],
    max: [500, 'Maximum donation volume is 500ml'],
    default: 450
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  donationCenter: {
    name: {
      type: String,
      required: [true, 'Donation center name is required']
    },
    address: {
      street: String,
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    phone: String,
    license: String
  },
  medicalScreening: {
    hemoglobinLevel: {
      type: Number,
      required: true,
      min: [12.5, 'Minimum hemoglobin level is 12.5 g/dL']
    },
    bloodPressure: {
      systolic: {
        type: Number,
        required: true,
        min: [90, 'Systolic pressure too low'],
        max: [180, 'Systolic pressure too high']
      },
      diastolic: {
        type: Number,
        required: true,
        min: [50, 'Diastolic pressure too low'],
        max: [100, 'Diastolic pressure too high']
      }
    },
    pulse: {
      type: Number,
      required: true,
      min: [50, 'Pulse rate too low'],
      max: [100, 'Pulse rate too high']
    },
    temperature: {
      type: Number,
      required: true,
      max: [37.5, 'Temperature too high for donation']
    },
    weight: {
      type: Number,
      required: true,
      min: [50, 'Minimum weight requirement is 50kg']
    }
  },
  staffDetails: {
    collectorName: {
      type: String,
      required: true
    },
    collectorId: {
      type: String,
      required: true
    },
    supervisorName: String,
    supervisorId: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rejected', 'processing'],
    default: 'scheduled'
  },
  testResults: {
    bloodGroupTest: {
      result: String,
      testDate: Date,
      testedBy: String
    },
    infectiousDiseaseTests: [{
      testName: {
        type: String,
        enum: ['HIV', 'Hepatitis B', 'Hepatitis C', 'Syphilis', 'Malaria']
      },
      result: {
        type: String,
        enum: ['negative', 'positive', 'pending', 'inconclusive']
      },
      testDate: Date,
      testedBy: String
    }],
    overallResult: {
      type: String,
      enum: ['safe', 'unsafe', 'pending'],
      default: 'pending'
    }
  },
  bloodBagDetails: {
    bagNumber: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    storageLocation: String,
    components: [{
      type: {
        type: String,
        enum: ['whole_blood', 'red_cells', 'plasma', 'platelets', 'cryoprecipitate']
      },
      volume: Number,
      bagNumber: String,
      expiryDate: Date,
      isUsed: {
        type: Boolean,
        default: false
      }
    }]
  },
  notes: {
    predonationNotes: String,
    postdonationNotes: String,
    adverseReactions: String,
    followUpRequired: {
      type: Boolean,
      default: false
    }
  },
  certification: {
    certificateGenerated: {
      type: Boolean,
      default: false
    },
    certificateUrl: String,
    certificateId: String,
    generatedAt: Date
  },
  rating: {
    donorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    donorFeedback: String,
    centerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    centerFeedback: String
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
donationSchema.index({ donor: 1, donationDate: -1 });
donationSchema.index({ bloodRequest: 1 });
donationSchema.index({ 'bloodBagDetails.bagNumber': 1 }, { unique: true });
donationSchema.index({ donationDate: -1 });
donationSchema.index({ status: 1 });

// Virtual for donation age (how old is the donation)
donationSchema.virtual('donationAge').get(function() {
  const now = new Date();
  const donationDate = new Date(this.donationDate);
  const diffTime = Math.abs(now - donationDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for blood expiry status
donationSchema.virtual('isExpired').get(function() {
  if (!this.bloodBagDetails.expiryDate) return false;
  return new Date() > new Date(this.bloodBagDetails.expiryDate);
});

// Method to generate certificate
donationSchema.methods.generateCertificate = async function() {
  if (this.status !== 'completed' || this.testResults.overallResult !== 'safe') {
    throw new Error('Cannot generate certificate for incomplete or unsafe donation');
  }
  
  // This would integrate with a certificate generation service
  // For now, just mark as generated
  this.certification.certificateGenerated = true;
  this.certification.generatedAt = new Date();
  this.certification.certificateId = `CERT-${this.bloodBagDetails.bagNumber}-${Date.now()}`;
  
  return this.save();
};

// Static method to get donation statistics
donationSchema.statics.getStatistics = function(startDate, endDate) {
  const matchStage = {
    status: 'completed',
    donationDate: {
      $gte: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Default to last year
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalVolume: { $sum: '$volumeDonated' },
        averageVolume: { $avg: '$volumeDonated' },
        bloodTypeDistribution: {
          $push: '$bloodType'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalDonations: 1,
        totalVolume: 1,
        averageVolume: { $round: ['$averageVolume', 2] },
        bloodTypeDistribution: 1
      }
    }
  ]);
};

// Pre-save middleware to set expiry date
donationSchema.pre('save', function(next) {
  if (this.isNew && this.donationDate && !this.bloodBagDetails.expiryDate) {
    // Whole blood expires after 35-42 days, using 35 days to be safe
    const expiryDate = new Date(this.donationDate);
    expiryDate.setDate(expiryDate.getDate() + 35);
    this.bloodBagDetails.expiryDate = expiryDate;
  }
  next();
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
