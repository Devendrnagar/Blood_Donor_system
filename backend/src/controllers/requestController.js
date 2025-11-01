import BloodRequest from '../models/BloodRequest.js';
import Donor from '../models/Donor.js';
import { sendDonorNotification, sendRequestConfirmation } from '../utils/emailService.js';

// @desc    Create blood request
// @route   POST /api/requests
// @access  Private
export const createBloodRequest = async (req, res) => {
  try {
    const requestData = {
      requester: req.user.id,
      ...req.body
    };

    const bloodRequest = await BloodRequest.create(requestData);
    await bloodRequest.populate('requester', 'fullName email phone');

    // Send confirmation email to requester
    try {
      await sendRequestConfirmation(req.user, bloodRequest);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // Find and notify nearby compatible donors
    try {
      const maxDistance = 50000; // 50km
      const donors = await Donor.findNearby(
        bloodRequest.location.coordinates,
        maxDistance,
        bloodRequest.bloodType
      );

      // Notify donors (limit to first 20 to avoid spam)
      const notificationPromises = donors.slice(0, 20).map(donor => 
        sendDonorNotification(donor, bloodRequest).catch(error => 
          console.error(`Failed to notify donor ${donor.user.email}:`, error)
        )
      );

      await Promise.allSettled(notificationPromises);
    } catch (notificationError) {
      console.error('Failed to notify donors:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: { bloodRequest }
    });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while creating blood request' }
    });
  }
};

// @desc    Get all blood requests
// @route   GET /api/requests
// @access  Public
export const getBloodRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { 
      status: { $in: ['active', 'partially_fulfilled'] },
      requiredBy: { $gt: new Date() }
    };
    
    if (req.query.bloodType) {
      filter.bloodType = req.query.bloodType;
    }
    
    if (req.query.urgency) {
      filter.urgency = req.query.urgency;
    }
    
    if (req.query.city) {
      filter['hospital.address.city'] = new RegExp(req.query.city, 'i');
    }

    const requests = await BloodRequest.find(filter)
      .populate('requester', 'fullName')
      .select('patientName bloodType unitsNeeded urgency requiredBy hospital.name hospital.address status unitsFulfilled createdAt')
      .sort({ urgency: -1, requiredBy: 1 })
      .skip(skip)
      .limit(limit);

    const total = await BloodRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        requests,
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
    console.error('Get blood requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching blood requests' }
    });
  }
};

// @desc    Get single blood request
// @route   GET /api/requests/:id
// @access  Public
export const getBloodRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id)
      .populate('requester', 'fullName email phone');

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood request not found' }
      });
    }

    // Hide sensitive information for non-owners
    let requestData = bloodRequest.toObject();
    if (!req.user || bloodRequest.requester._id.toString() !== req.user.id) {
      if (requestData.requester) {
        delete requestData.requester.email;
        delete requestData.requester.phone;
      }
      delete requestData.contactInfo.email;
      delete requestData.responses;
    }

    res.status(200).json({
      success: true,
      data: { bloodRequest: requestData }
    });
  } catch (error) {
    console.error('Get blood request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching blood request' }
    });
  }
};

// @desc    Get nearby blood requests
// @route   GET /api/requests/nearby
// @access  Public
export const getNearbyRequests = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50000, bloodType } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const requests = await BloodRequest.findNearby(coordinates, parseInt(maxDistance), bloodType);

    res.status(200).json({
      success: true,
      data: {
        requests,
        location: { latitude, longitude },
        searchRadius: maxDistance,
        bloodType: bloodType || 'all'
      }
    });
  } catch (error) {
    console.error('Get nearby requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while finding nearby requests' }
    });
  }
};

// @desc    Get user's blood requests
// @route   GET /api/requests/user/my-requests
// @access  Private
export const getMyRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const requests = await BloodRequest.find({ requester: req.user.id })
      .populate('responses.donor', 'user')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BloodRequest.countDocuments({ requester: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        requests,
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
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching your requests' }
    });
  }
};

// @desc    Update blood request
// @route   PUT /api/requests/:id
// @access  Private
export const updateBloodRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood request not found' }
      });
    }

    // Check if user is the requester
    if (bloodRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this request' }
      });
    }

    // Don't allow updates if request is fulfilled or expired
    if (['fulfilled', 'expired'].includes(bloodRequest.status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot update fulfilled or expired request' }
      });
    }

    const allowedUpdates = [
      'patientName', 'unitsNeeded', 'urgency', 'requiredBy', 'hospital',
      'description', 'contactInfo', 'medicalDetails'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(bloodRequest, updates);
    await bloodRequest.save();

    res.status(200).json({
      success: true,
      message: 'Blood request updated successfully',
      data: { bloodRequest }
    });
  } catch (error) {
    console.error('Update blood request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating blood request' }
    });
  }
};

// @desc    Delete blood request
// @route   DELETE /api/requests/:id
// @access  Private
export const deleteBloodRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood request not found' }
      });
    }

    // Check if user is the requester
    if (bloodRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this request' }
      });
    }

    await bloodRequest.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blood request deleted successfully'
    });
  } catch (error) {
    console.error('Delete blood request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while deleting blood request' }
    });
  }
};

// @desc    Respond to blood request
// @route   POST /api/requests/:id/respond
// @access  Private
export const respondToRequest = async (req, res) => {
  try {
    const { message } = req.body;
    
    const bloodRequest = await BloodRequest.findById(req.params.id);
    
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood request not found' }
      });
    }

    // Check if request is still active
    if (!['active', 'partially_fulfilled'].includes(bloodRequest.status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Request is no longer accepting responses' }
      });
    }

    // Find donor profile
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      return res.status(400).json({
        success: false,
        error: { message: 'You must be registered as a donor to respond' }
      });
    }

    // Check if donor already responded
    const existingResponse = bloodRequest.responses.find(
      resp => resp.donor.toString() === donor._id.toString()
    );

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        error: { message: 'You have already responded to this request' }
      });
    }

    // Add response
    bloodRequest.responses.push({
      donor: donor._id,
      message: message || 'I am available to donate',
      status: 'pending'
    });

    await bloodRequest.save();
    await bloodRequest.populate('responses.donor', 'user bloodType');

    res.status(200).json({
      success: true,
      message: 'Response submitted successfully',
      data: { bloodRequest }
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while submitting response' }
    });
  }
};

// @desc    Get request responses
// @route   GET /api/requests/:id/responses
// @access  Private
export const getRequestResponses = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id)
      .populate({
        path: 'responses.donor',
        populate: {
          path: 'user',
          select: 'fullName phone email avatar'
        }
      });

    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood request not found' }
      });
    }

    // Check if user is the requester
    if (bloodRequest.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view responses' }
      });
    }

    res.status(200).json({
      success: true,
      data: { 
        responses: bloodRequest.responses,
        requestId: bloodRequest._id,
        totalResponses: bloodRequest.responses.length
      }
    });
  } catch (error) {
    console.error('Get request responses error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching responses' }
    });
  }
};

// @desc    Search blood requests
// @route   GET /api/requests/search
// @access  Public
export const searchRequests = async (req, res) => {
  try {
    const { query, bloodType, urgency, city, state, maxDistance, latitude, longitude } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let searchFilter = { 
      status: { $in: ['active', 'partially_fulfilled'] },
      requiredBy: { $gt: new Date() }
    };

    // Text search
    if (query) {
      searchFilter.$or = [
        { patientName: new RegExp(query, 'i') },
        { 'hospital.name': new RegExp(query, 'i') },
        { 'hospital.address.city': new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') }
      ];
    }

    // Filters
    if (bloodType) searchFilter.bloodType = bloodType;
    if (urgency) searchFilter.urgency = urgency;
    if (city) searchFilter['hospital.address.city'] = new RegExp(city, 'i');
    if (state) searchFilter['hospital.address.state'] = new RegExp(state, 'i');

    let requests;
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

      requests = await BloodRequest.find(searchFilter)
        .populate('requester', 'fullName')
        .select('patientName bloodType unitsNeeded urgency requiredBy hospital status unitsFulfilled location')
        .skip(skip)
        .limit(limit);

      total = await BloodRequest.countDocuments(searchFilter);
    } else {
      requests = await BloodRequest.find(searchFilter)
        .populate('requester', 'fullName')
        .select('patientName bloodType unitsNeeded urgency requiredBy hospital status unitsFulfilled')
        .sort({ urgency: -1, requiredBy: 1 })
        .skip(skip)
        .limit(limit);

      total = await BloodRequest.countDocuments(searchFilter);
    }

    res.status(200).json({
      success: true,
      data: {
        requests,
        searchParams: { query, bloodType, urgency, city, state, maxDistance },
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
    console.error('Search requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while searching requests' }
    });
  }
};

// @desc    Get request statistics
// @route   GET /api/requests/stats
// @access  Public
export const getRequestStats = async (req, res) => {
  try {
    const totalRequests = await BloodRequest.countDocuments();
    const activeRequests = await BloodRequest.countDocuments({ 
      status: { $in: ['active', 'partially_fulfilled'] },
      requiredBy: { $gt: new Date() }
    });
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });
    
    // Blood type demand
    const bloodTypeDemand = await BloodRequest.aggregate([
      { $match: { status: { $in: ['active', 'partially_fulfilled'] } } },
      { $group: { _id: '$bloodType', count: { $sum: 1 }, totalUnits: { $sum: '$unitsNeeded' } } },
      { $sort: { count: -1 } }
    ]);

    // Urgency distribution
    const urgencyStats = await BloodRequest.aggregate([
      { $match: { status: { $in: ['active', 'partially_fulfilled'] } } },
      { $group: { _id: '$urgency', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Location demand (top cities)
    const locationDemand = await BloodRequest.aggregate([
      { $match: { status: { $in: ['active', 'partially_fulfilled'] } } },
      { $group: { _id: '$hospital.address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalRequests,
          activeRequests,
          fulfilledRequests,
          fulfillmentRate: totalRequests > 0 ? ((fulfilledRequests / totalRequests) * 100).toFixed(2) : 0
        },
        bloodTypeDemand,
        urgencyDistribution: urgencyStats,
        topCitiesByDemand: locationDemand
      }
    });
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching request statistics' }
    });
  }
};
