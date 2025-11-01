import Certificate from '../models/Certificate.js';
import Donation from '../models/Donation.js';
import { sendCertificateEmail } from '../utils/emailService.js';

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private
export const getCertificates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter - users can only see their own certificates unless admin
    const filter = req.user.role === 'admin' ? {} : { donor: req.user.id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.certificateType) {
      filter.certificateType = req.query.certificateType;
    }

    const certificates = await Certificate.find(filter)
      .populate('donor', 'fullName email')
      .populate('donation', 'donationDate bloodType volumeDonated')
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Certificate.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        certificates,
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
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching certificates' }
    });
  }
};

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
export const getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('donor', 'fullName email phone')
      .populate('donation', 'donationDate bloodType volumeDonated donationCenter');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found' }
      });
    }

    // Check authorization - only certificate owner or admin can view
    if (certificate.donor._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view this certificate' }
      });
    }

    res.status(200).json({
      success: true,
      data: { certificate }
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching certificate' }
    });
  }
};

// @desc    Get user's certificates
// @route   GET /api/certificates/my-certificates
// @access  Private
export const getMyCertificates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const certificates = await Certificate.find({ donor: req.user.id })
      .populate('donation', 'donationDate bloodType volumeDonated donationCenter')
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Certificate.countDocuments({ donor: req.user.id });

    // Get achievement counts
    const achievementCounts = await Certificate.aggregate([
      { $match: { donor: req.user.id } },
      { $unwind: '$achievements' },
      { $group: { _id: '$achievements.type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        certificates,
        achievementCounts,
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
    console.error('Get my certificates error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching your certificates' }
    });
  }
};

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
// @access  Private
export const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('donor', 'fullName email')
      .populate('donation', 'donationDate bloodType volumeDonated donationCenter');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found' }
      });
    }

    // Check authorization
    if (certificate.donor._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to download this certificate' }
      });
    }

    // Record download
    await certificate.recordDownload();

    // In a real implementation, you would generate and return the PDF file
    // For now, we'll return the certificate data with a download URL
    const downloadUrl = `${req.protocol}://${req.get('host')}/api/certificates/${certificate._id}/pdf`;

    res.status(200).json({
      success: true,
      message: 'Certificate ready for download',
      data: {
        certificate,
        downloadUrl,
        downloadCount: certificate.downloadCount
      }
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while preparing certificate download' }
    });
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:verificationCode
// @access  Public
export const verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.verifyCertificate(verificationCode);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found or invalid verification code' }
      });
    }

    // Return limited information for public verification
    const verificationData = {
      isValid: true,
      certificateId: certificate.certificateId,
      donorName: certificate.donor.fullName,
      donationDate: certificate.donationDetails.donationDate,
      bloodType: certificate.donationDetails.bloodType,
      volumeDonated: certificate.donationDetails.volumeDonated,
      donationCenter: certificate.donationDetails.donationCenter.name,
      issuedDate: certificate.generatedAt,
      status: certificate.status
    };

    res.status(200).json({
      success: true,
      message: 'Certificate verified successfully',
      data: { verification: verificationData }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error during certificate verification' }
    });
  }
};

// @desc    Regenerate certificate
// @route   POST /api/certificates/:id/regenerate
// @access  Private
export const regenerateCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('donor', 'fullName email')
      .populate('donation');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found' }
      });
    }

    // Check authorization
    if (certificate.donor._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to regenerate this certificate' }
      });
    }

    // Update certificate with new generation timestamp
    certificate.generatedAt = new Date();
    certificate.metadata.version = `${parseFloat(certificate.metadata.version) + 0.1}`;
    
    // Regenerate QR code
    await certificate.generateQRCode();
    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate regenerated successfully',
      data: { certificate }
    });
  } catch (error) {
    console.error('Regenerate certificate error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while regenerating certificate' }
    });
  }
};

// @desc    Share certificate
// @route   POST /api/certificates/:id/share
// @access  Private
export const shareCertificate = async (req, res) => {
  try {
    const { platform, isPublic } = req.body;
    
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found' }
      });
    }

    // Check authorization
    if (certificate.donor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to share this certificate' }
      });
    }

    // Update sharing settings
    if (typeof isPublic === 'boolean') {
      certificate.sharing.isPubliclyShared = isPublic;
    }

    if (platform && ['facebook', 'twitter', 'linkedin', 'instagram'].includes(platform)) {
      certificate.sharing.socialMediaShared[platform] = true;
    }

    // Generate shareable link if not exists
    if (!certificate.sharing.shareableLink) {
      certificate.sharing.shareableLink = `${process.env.FRONTEND_URL}/certificates/public/${certificate.verificationDetails.verificationCode}`;
    }

    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate sharing settings updated',
      data: {
        shareableLink: certificate.sharing.shareableLink,
        isPubliclyShared: certificate.sharing.isPubliclyShared,
        socialMediaShared: certificate.sharing.socialMediaShared
      }
    });
  } catch (error) {
    console.error('Share certificate error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating sharing settings' }
    });
  }
};

// @desc    Get certificate statistics
// @route   GET /api/certificates/stats
// @access  Public (with optional auth)
export const getCertificateStats = async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments({ status: 'issued' });
    const totalDownloads = await Certificate.aggregate([
      { $match: { status: 'issued' } },
      { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
    ]);

    // Certificate type distribution
    const typeDistribution = await Certificate.aggregate([
      { $match: { status: 'issued' } },
      { $group: { _id: '$certificateType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly certificate generation (last 12 months)
    const generationTrends = await Certificate.aggregate([
      {
        $match: {
          status: 'issued',
          generatedAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$generatedAt' },
            month: { $month: '$generatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top achievers (most certificates)
    const topAchievers = await Certificate.aggregate([
      { $match: { status: 'issued' } },
      { $group: { _id: '$donor', certificateCount: { $sum: 1 } } },
      { $sort: { certificateCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'donorInfo'
        }
      },
      {
        $project: {
          certificateCount: 1,
          donorName: { $first: '$donorInfo.fullName' }
        }
      }
    ]);

    const downloads = totalDownloads.length > 0 ? totalDownloads[0].totalDownloads : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCertificates,
          totalDownloads: downloads,
          avgDownloadsPerCertificate: totalCertificates > 0 ? (downloads / totalCertificates).toFixed(2) : 0
        },
        typeDistribution,
        generationTrends,
        topAchievers: req.user ? topAchievers : [] // Only show top achievers if authenticated
      }
    });
  } catch (error) {
    console.error('Get certificate stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching certificate statistics' }
    });
  }
};

// @desc    Send certificate email
// @route   POST /api/certificates/:id/send-email
// @access  Private
export const sendCertificateEmailEndpoint = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('donor', 'fullName email')
      .populate('donation');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found' }
      });
    }

    // Check authorization - only the donor or admin can request email
    if (certificate.donor._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to send this certificate' }
      });
    }

    // Send certificate email
    await sendCertificateEmail(certificate.donor, certificate);

    res.status(200).json({
      success: true,
      message: 'Certificate email sent successfully'
    });
  } catch (error) {
    console.error('Send certificate email error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while sending certificate email' }
    });
  }
};
