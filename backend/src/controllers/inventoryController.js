import BloodInventory from '../models/BloodInventory.js';
import Donation from '../models/Donation.js';
import Certificate from '../models/Certificate.js';
import Donor from '../models/Donor.js';
import BloodRequest from '../models/BloodRequest.js';

// @desc    Get dashboard statistics
// @route   GET /api/inventory/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date filter for donations
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.donationDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get blood inventory summary
    const inventorySummary = await BloodInventory.getInventorySummary();
    
    // Get total donors
    const totalDonors = await Donor.countDocuments({ isAvailable: true });
    
    // Get donations with date filter
    const totalDonations = await Donation.countDocuments(dateFilter);
    
    // Get recent donations (last 10)
    const recentDonations = await Donation.find(dateFilter)
      .populate([
        { path: 'donor', populate: { path: 'user', select: 'fullName' } },
        { path: 'bloodRequest', select: 'patientName' }
      ])
      .sort({ donationDate: -1 })
      .limit(10)
      .select('donationDate bloodType volumeDonated donationCenter status');

    // Get location-wise inventory
    const locationInventory = await BloodInventory.getLocationInventory();
    
    // Get certificate stats
    const certificateStats = await Certificate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get low stock alerts
    const lowStockAlerts = await BloodInventory.find({
      $expr: { $lte: ['$unitsAvailable', '$minimumThreshold'] }
    })
    .select('location bloodType unitsAvailable minimumThreshold')
    .sort({ unitsAvailable: 1 });

    // Format certificate stats
    const certificateSummary = {
      issued: certificateStats.find(stat => stat._id === 'issued')?.count || 0,
      pending: certificateStats.find(stat => stat._id === 'pending')?.count || 0,
      revoked: certificateStats.find(stat => stat._id === 'revoked')?.count || 0,
      total: certificateStats.reduce((sum, stat) => sum + stat.count, 0)
    };

    // Calculate total units available across all blood types
    const totalUnitsAvailable = inventorySummary.reduce((sum, item) => sum + item.availableUnits, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUnitsAvailable,
          totalDonors,
          totalDonations,
          totalLocations: locationInventory.length
        },
        bloodInventory: inventorySummary,
        recentDonations,
        locationInventory,
        certificateStats: certificateSummary,
        lowStockAlerts,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching dashboard statistics' }
    });
  }
};

// @desc    Get blood inventory
// @route   GET /api/inventory
// @access  Private
const getBloodInventory = async (req, res) => {
  try {
    const {
      bloodType,
      location,
      city,
      status,
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (bloodType && bloodType !== 'All') {
      filter.bloodType = bloodType;
    }
    if (location) {
      filter['location.name'] = new RegExp(location, 'i');
    }
    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const inventory = await BloodInventory.find(filter)
      .populate([
        { path: 'createdBy', select: 'fullName' },
        { path: 'lastUpdatedBy', select: 'fullName' }
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BloodInventory.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        inventory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCount: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get blood inventory error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching blood inventory' }
    });
  }
};

// @desc    Create blood inventory entry
// @route   POST /api/inventory
// @access  Private/Admin
const createBloodInventory = async (req, res) => {
  try {
    const inventoryData = {
      ...req.body,
      createdBy: req.user._id
    };

    const inventory = await BloodInventory.create(inventoryData);
    await inventory.populate([
      { path: 'createdBy', select: 'fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Blood inventory entry created successfully',
      data: { inventory }
    });

  } catch (error) {
    console.error('Create blood inventory error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: validationErrors
        }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error while creating blood inventory entry' }
    });
  }
};

// @desc    Update blood inventory entry
// @route   PUT /api/inventory/:id
// @access  Private/Admin
const updateBloodInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };

    const inventory = await BloodInventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'fullName' },
      { path: 'lastUpdatedBy', select: 'fullName' }
    ]);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood inventory entry not found' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blood inventory entry updated successfully',
      data: { inventory }
    });

  } catch (error) {
    console.error('Update blood inventory error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: validationErrors
        }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating blood inventory entry' }
    });
  }
};

// @desc    Delete blood inventory entry
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
const deleteBloodInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const inventory = await BloodInventory.findByIdAndDelete(id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Blood inventory entry not found' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blood inventory entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete blood inventory error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while deleting blood inventory entry' }
    });
  }
};

// @desc    Get inventory alerts
// @route   GET /api/inventory/alerts
// @access  Private
const getInventoryAlerts = async (req, res) => {
  try {
    // Low stock alerts
    const lowStockAlerts = await BloodInventory.find({
      $expr: { $lte: ['$unitsAvailable', '$minimumThreshold'] }
    }).select('location bloodType unitsAvailable minimumThreshold status');

    // Expiring soon alerts (within 7 days)
    const expiringSoonAlerts = await BloodInventory.find({
      expiryDate: {
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      expiryDate: { $gt: new Date() }
    }).select('location bloodType unitsAvailable expiryDate');

    // Expired alerts
    const expiredAlerts = await BloodInventory.find({
      expiryDate: { $lte: new Date() }
    }).select('location bloodType unitsAvailable expiryDate');

    res.status(200).json({
      success: true,
      data: {
        lowStock: lowStockAlerts,
        expiringSoon: expiringSoonAlerts,
        expired: expiredAlerts,
        totalAlerts: lowStockAlerts.length + expiringSoonAlerts.length + expiredAlerts.length
      }
    });

  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching inventory alerts' }
    });
  }
};

// @desc    Generate inventory report
// @route   GET /api/inventory/report
// @access  Private
const generateInventoryReport = async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;

    // Get complete inventory data
    const inventoryData = await BloodInventory.find({})
      .populate([
        { path: 'createdBy', select: 'fullName' },
        { path: 'lastUpdatedBy', select: 'fullName' }
      ])
      .sort({ 'location.city': 1, 'location.name': 1, bloodType: 1 });

    // Get donations data for the period
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.donationDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const donationsData = await Donation.find(dateFilter)
      .populate([
        { path: 'donor', populate: { path: 'user', select: 'fullName' } }
      ])
      .sort({ donationDate: -1 });

    // Generate summary statistics
    const summaryStats = await BloodInventory.getInventorySummary();
    const locationStats = await BloodInventory.getLocationInventory();

    const reportData = {
      generatedAt: new Date(),
      period: { startDate, endDate },
      summary: {
        totalLocations: locationStats.length,
        totalUnitsAvailable: summaryStats.reduce((sum, item) => sum + item.availableUnits, 0),
        totalDonations: donationsData.length,
        bloodTypeBreakdown: summaryStats
      },
      inventory: inventoryData,
      locations: locationStats,
      recentDonations: donationsData.slice(0, 50), // Limit to 50 recent donations
      alerts: {
        lowStock: inventoryData.filter(item => item.unitsAvailable <= item.minimumThreshold),
        expiring: inventoryData.filter(item => 
          new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
          new Date(item.expiryDate) > new Date()
        ),
        expired: inventoryData.filter(item => new Date(item.expiryDate) <= new Date())
      }
    };

    if (format === 'csv') {
      // For CSV format, we'll return a structured data that can be converted to CSV on frontend
      res.status(200).json({
        success: true,
        format: 'csv',
        data: reportData
      });
    } else {
      res.status(200).json({
        success: true,
        format: 'json',
        data: reportData
      });
    }

  } catch (error) {
    console.error('Generate inventory report error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while generating inventory report' }
    });
  }
};

export {
  getDashboardStats,
  getBloodInventory,
  createBloodInventory,
  updateBloodInventory,
  deleteBloodInventory,
  getInventoryAlerts,
  generateInventoryReport
};
