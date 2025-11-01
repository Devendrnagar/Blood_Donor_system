import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Donor must be at least 18 years old'],
    max: [65, 'Donor must be under 65 years old']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [50, 'Donor must weigh at least 50 kg']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  lastDonationDate: {
    type: Date,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  medicalHistory: {
    hasChronicIllness: {
      type: Boolean,
      required: true,
      default: false
    },
    chronicIllnessDetails: String,
    currentMedications: [String],
    allergies: [String],
    hasRecentSurgery: {
      type: Boolean,
      default: false
    },
    recentSurgeryDetails: String,
    hasInfectiousDiseases: {
      type: Boolean,
      default: false
    }
  },
  contactPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    phone: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String, // URLs to uploaded documents
    documentType: {
      type: String,
      enum: ['id_proof', 'medical_certificate', 'other']
    }
  }],
  donationCount: {
    type: Number,
    default: 0
  },
  totalVolumeDonated: {
    type: Number,
    default: 0 // in ml
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create geospatial index
donorSchema.index({ location: '2dsphere' });

// Create compound indexes for efficient queries
donorSchema.index({ bloodType: 1, isAvailable: 1 });
donorSchema.index({ 'address.city': 1, bloodType: 1 });
donorSchema.index({ user: 1 }, { unique: true });

// Virtual for next eligible donation date
donorSchema.virtual('nextEligibleDonationDate').get(function() {
  if (!this.lastDonationDate) return new Date();
  
  const lastDonation = new Date(this.lastDonationDate);
  const nextEligible = new Date(lastDonation);
  nextEligible.setDate(lastDonation.getDate() + 56); // 8 weeks gap
  
  return nextEligible;
});

// Method to check if donor is eligible to donate
donorSchema.methods.isEligibleToDonate = function() {
  if (!this.isAvailable) return false;
  if (!this.lastDonationDate) return true;
  
  const now = new Date();
  const nextEligible = this.nextEligibleDonationDate;
  
  return now >= nextEligible;
};

// Method to update availability based on last donation
donorSchema.methods.updateAvailability = function() {
  this.isAvailable = this.isEligibleToDonate();
  return this.save();
};

// Static method to find nearby donors
donorSchema.statics.findNearby = function(coordinates, maxDistance = 50000, bloodType = null) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    isAvailable: true
  };
  
  if (bloodType) {
    query.bloodType = bloodType;
  }
  
  return this.find(query).populate('user', 'fullName phone email avatar');
};

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;
