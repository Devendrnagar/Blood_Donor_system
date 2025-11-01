import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsNeeded: {
    type: Number,
    required: [true, 'Number of units needed is required'],
    min: [1, 'At least 1 unit is required'],
    max: [10, 'Maximum 10 units can be requested']
  },
  urgency: {
    type: String,
    required: [true, 'Urgency level is required'],
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  requiredBy: {
    type: Date,
    required: [true, 'Required by date is required'],
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Required by date must be in the future'
    }
  },
  hospital: {
    name: {
      type: String,
      required: [true, 'Hospital name is required']
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
    phone: {
      type: String,
      required: [true, 'Hospital phone is required']
    },
    contactPerson: String
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
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    },
    email: String,
    alternatePhone: String
  },
  status: {
    type: String,
    enum: ['active', 'partially_fulfilled', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  responses: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    message: String,
    responseDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  unitsFulfilled: {
    type: Number,
    default: 0
  },
  donations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  }],
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  tags: [String],
  isEmergency: {
    type: Boolean,
    default: false
  },
  medicalDetails: {
    patientAge: Number,
    patientWeight: Number,
    diagnosis: String,
    doctorName: String,
    doctorPhone: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create geospatial index
bloodRequestSchema.index({ location: '2dsphere' });

// Create compound indexes for efficient queries
bloodRequestSchema.index({ bloodType: 1, status: 1, urgency: 1 });
bloodRequestSchema.index({ 'hospital.address.city': 1, bloodType: 1 });
bloodRequestSchema.index({ requiredBy: 1, status: 1 });
bloodRequestSchema.index({ requester: 1 });

// Virtual for time remaining
bloodRequestSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const required = new Date(this.requiredBy);
  return Math.max(0, required.getTime() - now.getTime());
});

// Virtual for fulfillment percentage
bloodRequestSchema.virtual('fulfillmentPercentage').get(function() {
  return Math.round((this.unitsFulfilled / this.unitsNeeded) * 100);
});

// Method to check if request is expired
bloodRequestSchema.methods.isExpired = function() {
  return new Date() > new Date(this.requiredBy);
};

// Method to update status based on fulfillment
bloodRequestSchema.methods.updateStatus = function() {
  if (this.isExpired() && this.status === 'active') {
    this.status = 'expired';
  } else if (this.unitsFulfilled >= this.unitsNeeded) {
    this.status = 'fulfilled';
  } else if (this.unitsFulfilled > 0) {
    this.status = 'partially_fulfilled';
  }
  
  return this.save();
};

// Static method to find nearby requests
bloodRequestSchema.statics.findNearby = function(coordinates, maxDistance = 50000, bloodType = null) {
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
    status: { $in: ['active', 'partially_fulfilled'] },
    requiredBy: { $gt: new Date() }
  };
  
  if (bloodType) {
    // Include compatible blood types
    const compatibleTypes = getCompatibleBloodTypes(bloodType);
    query.bloodType = { $in: compatibleTypes };
  }
  
  return this.find(query)
    .populate('requester', 'fullName phone email')
    .sort({ urgency: -1, requiredBy: 1 });
};

// Helper function to get compatible blood types for donation
function getCompatibleBloodTypes(donorBloodType) {
  const compatibility = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };
  
  return compatibility[donorBloodType] || [];
}

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

export default BloodRequest;
