import mongoose from 'mongoose';

const bloodInventorySchema = new mongoose.Schema({
  location: {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Location type is required'],
      enum: ['Hospital', 'Blood Bank', 'Medical Camp', 'Mobile Unit'],
      default: 'Hospital'
    },
    address: {
      street: String,
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      zipCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    phone: String,
    email: String,
    license: String
  },
  bloodType: {
    type: String,
    required: [true, 'Blood type is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsAvailable: {
    type: Number,
    required: [true, 'Units available is required'],
    min: [0, 'Units cannot be negative'],
    default: 0
  },
  unitsReserved: {
    type: Number,
    default: 0,
    min: [0, 'Reserved units cannot be negative']
  },
  minimumThreshold: {
    type: Number,
    default: 5,
    min: [0, 'Minimum threshold cannot be negative']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Max capacity is required'],
    min: [1, 'Max capacity must be at least 1']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  collectionDate: {
    type: Date,
    required: [true, 'Collection date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Collection date cannot be in the future'
    }
  },
  donationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  }],
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Expired', 'Reserved'],
    default: function() {
      if (this.unitsAvailable === 0) return 'Out of Stock';
      if (this.unitsAvailable <= this.minimumThreshold) return 'Low Stock';
      if (this.expiryDate <= new Date()) return 'Expired';
      return 'Available';
    }
  },
  qualityCheck: {
    tested: {
      type: Boolean,
      default: false
    },
    testResults: {
      hiv: { type: String, enum: ['Negative', 'Positive', 'Pending'] },
      hepatitisB: { type: String, enum: ['Negative', 'Positive', 'Pending'] },
      hepatitisC: { type: String, enum: ['Negative', 'Positive', 'Pending'] },
      syphilis: { type: String, enum: ['Negative', 'Positive', 'Pending'] },
      malaria: { type: String, enum: ['Negative', 'Positive', 'Pending'] }
    },
    testDate: Date,
    technician: String
  },
  storageConditions: {
    temperature: {
      type: Number,
      min: [2, 'Temperature too low'],
      max: [6, 'Temperature too high'],
      default: 4
    },
    refrigeratorId: String,
    lastTemperatureCheck: {
      type: Date,
      default: Date.now
    }
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
bloodInventorySchema.index({ 'location.coordinates': '2dsphere' });
bloodInventorySchema.index({ bloodType: 1, status: 1 });
bloodInventorySchema.index({ 'location.city': 1, 'location.state': 1 });
bloodInventorySchema.index({ expiryDate: 1 });
bloodInventorySchema.index({ unitsAvailable: 1 });

// Virtual for available units (total - reserved)
bloodInventorySchema.virtual('actualAvailable').get(function() {
  return Math.max(0, this.unitsAvailable - this.unitsReserved);
});

// Virtual for days until expiry
bloodInventorySchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status
bloodInventorySchema.pre('save', function(next) {
  // Update status based on current conditions
  if (this.expiryDate <= new Date()) {
    this.status = 'Expired';
  } else if (this.unitsAvailable === 0) {
    this.status = 'Out of Stock';
  } else if (this.unitsAvailable <= this.minimumThreshold) {
    this.status = 'Low Stock';
  } else if (this.unitsReserved > 0) {
    this.status = 'Reserved';
  } else {
    this.status = 'Available';
  }
  
  next();
});

// Static method to get inventory summary
bloodInventorySchema.statics.getInventorySummary = async function() {
  const summary = await this.aggregate([
    {
      $group: {
        _id: '$bloodType',
        totalUnits: { $sum: '$unitsAvailable' },
        reservedUnits: { $sum: '$unitsReserved' },
        locations: { $addToSet: '$location.name' },
        lowStockLocations: {
          $sum: {
            $cond: [{ $lte: ['$unitsAvailable', '$minimumThreshold'] }, 1, 0]
          }
        },
        expiringSoon: {
          $sum: {
            $cond: [
              { $lte: ['$expiryDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        bloodType: '$_id',
        totalUnits: 1,
        reservedUnits: 1,
        availableUnits: { $subtract: ['$totalUnits', '$reservedUnits'] },
        locationCount: { $size: '$locations' },
        lowStockLocations: 1,
        expiringSoon: 1,
        status: {
          $cond: [
            { $eq: ['$totalUnits', 0] },
            'Out of Stock',
            {
              $cond: [
                { $lte: ['$totalUnits', 10] },
                'Low Stock',
                'Available'
              ]
            }
          ]
        }
      }
    },
    { $sort: { bloodType: 1 } }
  ]);

  return summary;
};

// Static method to get location-wise inventory
bloodInventorySchema.statics.getLocationInventory = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: {
          name: '$location.name',
          city: '$location.city',
          type: '$location.type'
        },
        bloodTypes: {
          $push: {
            type: '$bloodType',
            units: '$unitsAvailable',
            reserved: '$unitsReserved',
            status: '$status',
            expiry: '$expiryDate'
          }
        },
        totalUnits: { $sum: '$unitsAvailable' },
        lastUpdated: { $max: '$updatedAt' }
      }
    },
    {
      $project: {
        location: '$_id',
        bloodTypes: 1,
        totalUnits: 1,
        lastUpdated: 1,
        status: {
          $cond: [
            { $eq: ['$totalUnits', 0] },
            'No Stock',
            {
              $cond: [
                { $lt: ['$totalUnits', 20] },
                'Low Stock',
                'Good Stock'
              ]
            }
          ]
        }
      }
    },
    { $sort: { 'location.city': 1, 'location.name': 1 } }
  ]);
};

const BloodInventory = mongoose.model('BloodInventory', bloodInventorySchema);

export default BloodInventory;
