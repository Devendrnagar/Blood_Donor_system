import Joi from 'joi';

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }
    
    next();
  };
};

// User registration validation
export const registerValidation = Joi.object({
  fullName: Joi.string().required().min(2).max(100).trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required().min(6).max(128),
  phone: Joi.string().required().pattern(/^\+?[\d\-\(\)\s]+$/),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
    country: Joi.string().default('India')
  }).optional()
});

// User login validation
export const loginValidation = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

// Donor registration validation
export const donorValidation = Joi.object({
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
  age: Joi.number().integer().min(18).max(65).required(),
  weight: Joi.number().min(50).required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  lastDonationDate: Joi.date().allow(null).optional(),
  isAvailable: Joi.boolean().default(true),
  medicalHistory: Joi.object({
    hasChronicIllness: Joi.boolean().required(),
    chronicIllnessDetails: Joi.string().when('hasChronicIllness', {
      is: true,
      then: Joi.string().required().min(1),
      otherwise: Joi.allow('')
    }),
    currentMedications: Joi.array().items(Joi.string()).default([]),
    allergies: Joi.array().items(Joi.string()).default([]),
    hasRecentSurgery: Joi.boolean().default(false),
    recentSurgeryDetails: Joi.string().when('hasRecentSurgery', {
      is: true,
      then: Joi.string().required().min(1),
      otherwise: Joi.allow('')
    }),
    hasInfectiousDiseases: Joi.boolean().default(false)
  }).required(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().default('India')
  }).required(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required().pattern(/^\+?[\d\-\(\)\s]+$/),
    relationship: Joi.string().required()
  }).required(),
  contactPreferences: Joi.object({
    email: Joi.boolean().default(true),
    phone: Joi.boolean().default(true),
    sms: Joi.boolean().default(false)
  }).optional()
});

// Blood request validation
export const bloodRequestValidation = Joi.object({
  patientName: Joi.string().required().trim(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
  unitsNeeded: Joi.number().integer().min(1).max(10).required(),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  requiredBy: Joi.date().greater('now').required(),
  hospital: Joi.object({
    name: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().allow(''),
      country: Joi.string().default('India')
    }).required(),
    phone: Joi.string().required().pattern(/^\+?[\d\-\(\)\s]+$/),
    contactPerson: Joi.string().allow('')
  }).required(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  description: Joi.string().max(500).allow(''),
  contactInfo: Joi.object({
    phone: Joi.string().required().pattern(/^\+?[\d\-\(\)\s]+$/),
    email: Joi.string().email().allow(''),
    alternatePhone: Joi.string().pattern(/^\+?[\d\-\(\)\s]+$/).allow('')
  }).required(),
  medicalDetails: Joi.object({
    patientAge: Joi.number().integer().min(0).max(120),
    patientWeight: Joi.number().min(0),
    diagnosis: Joi.string().allow(''),
    doctorName: Joi.string().allow(''),
    doctorPhone: Joi.string().pattern(/^\+?[\d\-\(\)\s]+$/).allow('')
  }).optional(),
  isEmergency: Joi.boolean().default(false)
});

// Donation validation
export const donationValidation = Joi.object({
  bloodRequest: Joi.string().required(), // ObjectId as string
  donationDate: Joi.date().required(),
  volumeDonated: Joi.number().min(350).max(500).default(450),
  donationCenter: Joi.object({
    name: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().allow(''),
      country: Joi.string().default('India')
    }).required(),
    phone: Joi.string().allow(''),
    license: Joi.string().allow('')
  }).required(),
  medicalScreening: Joi.object({
    hemoglobinLevel: Joi.number().min(12.5).required(),
    bloodPressure: Joi.object({
      systolic: Joi.number().min(90).max(180).required(),
      diastolic: Joi.number().min(50).max(100).required()
    }).required(),
    pulse: Joi.number().min(50).max(100).required(),
    temperature: Joi.number().max(37.5).required(),
    weight: Joi.number().min(50).required()
  }).required(),
  staffDetails: Joi.object({
    collectorName: Joi.string().required(),
    collectorId: Joi.string().required(),
    supervisorName: Joi.string().allow(''),
    supervisorId: Joi.string().allow('')
  }).required(),
  bloodBagDetails: Joi.object({
    bagNumber: Joi.string().required(),
    storageLocation: Joi.string().allow('')
  }).required(),
  notes: Joi.object({
    predonationNotes: Joi.string().allow(''),
    postdonationNotes: Joi.string().allow(''),
    adverseReactions: Joi.string().allow(''),
    followUpRequired: Joi.boolean().default(false)
  }).optional()
});

// Password change validation
export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(6).max(128)
});

// Profile update validation
export const updateProfileValidation = Joi.object({
  fullName: Joi.string().min(2).max(100).trim(),
  phone: Joi.string().pattern(/^\+?[\d\-\(\)\s]+$/),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
    country: Joi.string()
  }),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2)
  })
});

// Pagination validation
export const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// Search validation
export const searchValidation = Joi.object({
  query: Joi.string().min(1).max(100).trim(),
  bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2),
    maxDistance: Joi.number().min(1000).max(100000).default(50000) // in meters
  }),
  urgency: Joi.string().valid('low', 'medium', 'high', 'critical'),
  status: Joi.string()
});
