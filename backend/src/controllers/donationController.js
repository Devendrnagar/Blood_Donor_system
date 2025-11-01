import Donation from '../models/Donation.js';
import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';
import Certificate from '../models/Certificate.js';
import { sendCertificateEmail } from '../utils/emailService.js';

// @desc    Create donation record (Admin only)
// @route   POST /api/donations
// @access  Private/Admin
export const createDonation = async (req, res) => {
  try {
    const donationData = {
      ...req.body
    };

    // Verify donor exists
    const donor = await Donor.findById(donationData.donor);
    if (!donor) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donor not found' }
      });
    }

    // Verify blood request exists
    const bloodRequest = await BloodRequest.findById(donationData.bloodRequest);
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood request not found' }
      });
    }

    // Set blood type from donor if not provided
    if (!donationData.bloodType) {
      donationData.bloodType = donor.bloodType;
    }

    const donation = await Donation.create(donationData);
    await donation.populate([
      { path: 'donor', populate: { path: 'user', select: 'fullName email phone' } },
      { path: 'bloodRequest', select: 'patientName bloodType unitsNeeded' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Donation record created successfully',
      data: { donation }
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while creating donation record' }
    });
  }
};

// @desc    Get all donations (Admin only)
// @route   GET /api/donations
// @access  Private/Admin
export const getDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.bloodType) {
      filter.bloodType = req.query.bloodType;
    }

    const donations = await Donation.find(filter)
      .populate([
        { path: 'donor', populate: { path: 'user', select: 'fullName email phone' } },
        { path: 'bloodRequest', select: 'patientName bloodType unitsNeeded' }
      ])
      .sort({ donationDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        donations,
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
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donations' }
    });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private
export const getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate([
        { path: 'donor', populate: { path: 'user', select: 'fullName email phone' } },
        { path: 'bloodRequest', select: 'patientName bloodType unitsNeeded requester' }
      ]);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donation not found' }
      });
    }

    // Check authorization - donor, requester, or admin can view
    const isOwner = donation.donor.user._id.toString() === req.user.id;
    const isRequester = donation.bloodRequest.requester.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isRequester && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view this donation' }
      });
    }

    res.status(200).json({
      success: true,
      data: { donation }
    });
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donation' }
    });
  }
};

// @desc    Update donation (Admin only)
// @route   PUT /api/donations/:id
// @access  Private/Admin
export const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donation not found' }
      });
    }

    const allowedUpdates = [
      'donationDate', 'volumeDonated', 'donationCenter', 'medicalScreening',
      'staffDetails', 'status', 'testResults', 'bloodBagDetails', 'notes', 'rating'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(donation, updates);
    await donation.save();

    await donation.populate([
      { path: 'donor', populate: { path: 'user', select: 'fullName email phone' } },
      { path: 'bloodRequest', select: 'patientName bloodType unitsNeeded' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Donation updated successfully',
      data: { donation }
    });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating donation' }
    });
  }
};

// @desc    Delete donation (Admin only)
// @route   DELETE /api/donations/:id
// @access  Private/Admin
export const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donation not found' }
      });
    }

    await donation.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while deleting donation' }
    });
  }
};

// @desc    Get user's donations
// @route   GET /api/donations/my-donations
// @access  Private
export const getMyDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find donor profile
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) {
      // Return empty donations array if user hasn't registered as donor yet
      return res.status(200).json({
        success: true,
        data: {
          donations: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    const donations = await Donation.find({ donor: donor._id })
      .populate('bloodRequest', 'patientName bloodType unitsNeeded hospital')
      .sort({ donationDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({ donor: donor._id });

    res.status(200).json({
      success: true,
      data: {
        donations,
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
    console.error('Get my donations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching your donations' }
    });
  }
};

// @desc    Complete donation (Admin only)
// @route   PUT /api/donations/:id/complete
// @access  Private/Admin
export const completeDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor')
      .populate('bloodRequest');

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donation not found' }
      });
    }

    if (donation.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Donation is already completed' }
      });
    }

    // Update donation status
    donation.status = 'completed';
    await donation.save();

    // Update donor's last donation date and donation count
    const donor = donation.donor;
    donor.lastDonationDate = donation.donationDate;
    donor.donationCount += 1;
    donor.totalVolumeDonated += donation.volumeDonated;
    await donor.updateAvailability(); // This will set availability based on last donation

    // Update blood request fulfillment
    const bloodRequest = donation.bloodRequest;
    bloodRequest.unitsFulfilled += 1;
    await bloodRequest.updateStatus();

    res.status(200).json({
      success: true,
      message: 'Donation completed successfully',
      data: { donation }
    });
  } catch (error) {
    console.error('Complete donation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while completing donation' }
    });
  }
};

// @desc    Add test results (Admin only)
// @route   PUT /api/donations/:id/test-results
// @access  Private/Admin
export const addTestResults = async (req, res) => {
  try {
    const { testResults } = req.body;
    
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donation not found' }
      });
    }

    donation.testResults = {
      ...donation.testResults,
      ...testResults
    };

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Test results added successfully',
      data: { donation }
    });
  } catch (error) {
    console.error('Add test results error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while adding test results' }
    });
  }
};

// @desc    Generate certificate for donation
// @route   POST /api/donations/:id/generate-certificate
// @access  Private
export const generateCertificate = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor')
      .populate('bloodRequest');

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Donation not found' }
      });
    }

    // Check if user is the donor
    if (donation.donor.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to generate certificate for this donation' }
      });
    }

    // Check if donation is completed and safe
    if (donation.status !== 'completed' || donation.testResults.overallResult !== 'safe') {
      return res.status(400).json({
        success: false,
        error: { message: 'Certificate can only be generated for completed and safe donations' }
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({ donation: donation._id });
    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Certificate already exists for this donation' }
      });
    }

    // Create certificate
    const certificate = await Certificate.create({
      donor: req.user.id,
      donation: donation._id,
      title: 'Blood Donation Certificate',
      description: `This certificate is awarded to ${req.user.fullName} for their generous blood donation.`,
      donationDetails: {
        donationDate: donation.donationDate,
        bloodType: donation.bloodType,
        volumeDonated: donation.volumeDonated,
        donationCenter: {
          name: donation.donationCenter.name,
          city: donation.donationCenter.address.city,
          state: donation.donationCenter.address.state
        }
      }
    });

    // Generate QR code
    await certificate.generateQRCode();

    // Update donation record
    donation.certification.certificateGenerated = true;
    donation.certification.certificateId = certificate.certificateId;
    donation.certification.generatedAt = new Date();
    await donation.save();

    // Send certificate email to donor
    try {
      await sendCertificateEmail(req.user, certificate);
      console.log('📧 Certificate email sent successfully to:', req.user.email);
    } catch (emailError) {
      console.error('❌ Failed to send certificate email:', emailError);
      // Don't fail the entire request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully and email sent',
      data: { certificate }
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while generating certificate' }
    });
  }
};

// @desc    Get donation statistics
// @route   GET /api/donations/stats
// @access  Private
export const getDonationStats = async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    const safeDonations = await Donation.countDocuments({ 'testResults.overallResult': 'safe' });

    // Total volume donated
    const volumeStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalVolume: { $sum: '$volumeDonated' }, avgVolume: { $avg: '$volumeDonated' } } }
    ]);

    // Blood type distribution
    const bloodTypeStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$bloodType', count: { $sum: 1 }, totalVolume: { $sum: '$volumeDonated' } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly donation trends (last 12 months)
    const donationTrends = await Donation.aggregate([
      {
        $match: {
          status: 'completed',
          donationDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' }
          },
          count: { $sum: 1 },
          volume: { $sum: '$volumeDonated' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const totalVolume = volumeStats.length > 0 ? volumeStats[0].totalVolume : 0;
    const avgVolume = volumeStats.length > 0 ? volumeStats[0].avgVolume : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDonations,
          completedDonations,
          safeDonations,
          totalVolume,
          avgVolume: Math.round(avgVolume),
          safetyRate: completedDonations > 0 ? ((safeDonations / completedDonations) * 100).toFixed(2) : 0
        },
        bloodTypeDistribution: bloodTypeStats,
        donationTrends
      }
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching donation statistics' }
    });
  }
};
