import Donor from '../models/Donor.js';
import User from '../models/User.js';
import { sendDonorRegistrationConfirmation } from '../utils/emailService.js';

// @desc    Register as donor
// @route   POST /api/donors/register
// @access  Private
export const registerDonor = async (req, res) => {
  try {
    // Check if user is already registered as donor
    const existingDonor = await Donor.findOne({ user: req.user.id });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        error: { message: 'User is already registered as a donor' }
      });
    }

    const donorData = {
      user: req.user.id,
      ...req.body
    };

    const donor = await Donor.create(donorData);
    await donor.populate('user', 'fullName email phone avatar');

    // Send registration confirmation email
    try {
      await sendDonorRegistrationConfirmation(donor.user, donor);
      console.log('✅ Donor registration confirmation email sent to:', donor.user.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send registration confirmation email:', emailError.message);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Donor registration successful',
      data: { donor }
    });
  } catch (error) {
    console.error('Donor registration error:', error);
    
    // Handle validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Validation failed',
          details: errors
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: { message: 'Server error during donor registration' }
    });
  }
};

// @desc    Get all donors
// @route   GET /api/donors
// @access  Public
export const getDonors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isAvailable: true, isVerified: true };
    
    if (req.query.bloodType) {
      filter.bloodType = req.query.bloodType;
    }
    
    if (req.query.city) {
      filter['address.city'] = new RegExp(req.query.city, 'i');
    }

    const donors = await Donor.find(filter)
      .populate('user', 'fullName avatar')
      .select('bloodType age isAvailable address.city address.state donationCount rating createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donor.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        donors,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donors' }
    });
  }
};

// @desc    Get single donor
// @route   GET /api/donors/:id
// @access  Public
export const getDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate('user', 'fullName email phone avatar address createdAt');

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    // Hide sensitive information for non-owners
    let donorData = donor.toObject();
    if (!req.user || donor.user._id.toString() !== req.user.id) {
      delete donorData.medicalHistory;
      delete donorData.emergencyContact;
      delete donorData.contactPreferences;
      delete donorData.verificationDocuments;
      if (donorData.user) {
        delete donorData.user.email;
        delete donorData.user.phone;
      }
    }

    res.status(200).json({
      success: true,
      data: { donor: donorData }
    });
  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donor' }
    });
  }
};

// @desc    Get nearby donors
// @route   GET /api/donors/nearby
// @access  Public
export const getNearbyDonors = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000, bloodType } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const donors = await Donor.findNearby(coordinates, parseInt(maxDistance), bloodType);

    res.status(200).json({
      success: true,
      data: {
        donors,
        location: { latitude, longitude },
        searchRadius: maxDistance,
        bloodType: bloodType || 'all'
      }
    });
  } catch (error) {
    console.error('Get nearby donors error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while finding nearby donors' }
    });
  }
};

// @desc    Get donor profile (own)
// @route   GET /api/donors/profile/me
// @access  Private
export const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id })
      .populate('user', 'fullName email phone avatar address');

    // Return success with null donor if not found (instead of 404)
    // This prevents unnecessary 404 errors in browser console when checking if user is a donor
    res.status(200).json({
      success: true,
      data: { donor: donor || null }
    });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donor profile' }
    });
  }
};

// @desc    Update donor profile
// @route   PUT /api/donors/profile
// @access  Private
export const updateDonor = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor profile not found' }
      });
    }

    const allowedUpdates = [
      'age', 'weight', 'lastDonationDate', 'isAvailable', 'medicalHistory',
      'contactPreferences', 'location', 'address', 'emergencyContact'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(donor, updates);
    await donor.save();

    await donor.populate('user', 'fullName email phone avatar');

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      data: { donor }
    });
  } catch (error) {
    console.error('Update donor error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating donor profile' }
    });
  }
};

// @desc    Update donor availability
// @route   PUT /api/donors/availability
// @access  Private
export const updateDonorAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const donor = await Donor.findOne({ user: req.user.id });

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor profile not found' }
      });
    }

    // Check if donor is eligible to be available
    if (isAvailable && !donor.isEligibleToDonate()) {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Cannot set as available. Must wait 8 weeks from last donation.',
          nextEligibleDate: donor.nextEligibleDonationDate
        }
      });
    }

    donor.isAvailable = isAvailable;
    await donor.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`,
      data: { 
        isAvailable: donor.isAvailable,
        nextEligibleDate: donor.nextEligibleDonationDate
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating availability' }
    });
  }
};

// @desc    Delete donor profile
// @route   DELETE /api/donors/profile
// @access  Private
export const deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });

    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor profile not found' }
      });
    }

    await donor.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donor profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete donor error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while deleting donor profile' }
    });
  }
};

// @desc    Search donors
// @route   GET /api/donors/search
// @access  Public
export const searchDonors = async (req, res) => {
  try {
    const { query, bloodType, city, state, maxDistance, latitude, longitude } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchFilter = { isAvailable: true, isVerified: true };

    // Text search
    if (query) {
      searchFilter.$or = [
        { 'address.city': new RegExp(query, 'i') },
        { 'address.state': new RegExp(query, 'i') }
      ];
    }

    // Blood type filter
    if (bloodType) {
      searchFilter.bloodType = bloodType;
    }

    // Location filters
    if (city) {
      searchFilter['address.city'] = new RegExp(city, 'i');
    }
    if (state) {
      searchFilter['address.state'] = new RegExp(state, 'i');
    }

    let donors;
    let total;

    // If coordinates provided, use geospatial search
    if (latitude && longitude) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      const distance = parseInt(maxDistance) || 50000;

      searchFilter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          $maxDistance: distance
        }
      };

      donors = await Donor.find(searchFilter)
        .populate('user', 'fullName avatar')
        .select('bloodType age isAvailable address.city address.state donationCount rating location')
        .skip(skip)
        .limit(limit);

      total = await Donor.countDocuments(searchFilter);
    } else {
      donors = await Donor.find(searchFilter)
        .populate('user', 'fullName avatar')
        .select('bloodType age isAvailable address.city address.state donationCount rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await Donor.countDocuments(searchFilter);
    }

    res.status(200).json({
      success: true,
      data: {
        donors,
        searchParams: { query, bloodType, city, state, maxDistance },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Search donors error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while searching donors' }
    });
  }
};

// @desc    Get donor statistics
// @route   GET /api/donors/stats
// @access  Public
export const getDonorStats = async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const availableDonors = await Donor.countDocuments({ isAvailable: true });
    const verifiedDonors = await Donor.countDocuments({ isVerified: true });

    // Blood type distribution
    const bloodTypeStats = await Donor.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Location distribution (top cities)
    const locationStats = await Donor.aggregate([
      { $match: { isVerified: true } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Age distribution
    const ageStats = await Donor.aggregate([
      { $match: { isVerified: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 25] }, then: '18-24' },
                { case: { $lt: ['$age', 35] }, then: '25-34' },
                { case: { $lt: ['$age', 45] }, then: '35-44' },
                { case: { $lt: ['$age', 55] }, then: '45-54' },
              ],
              default: '55+'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDonors,
          availableDonors,
          verifiedDonors,
          availabilityPercentage: totalDonors > 0 ? ((availableDonors / totalDonors) * 100).toFixed(2) : 0
        },
        bloodTypeDistribution: bloodTypeStats,
        topCities: locationStats,
        ageDistribution: ageStats
      }
    });
  } catch (error) {
    console.error('Get donor stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donor statistics' }
    });
  }
};
