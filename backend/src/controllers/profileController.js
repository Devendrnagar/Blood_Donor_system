import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/profiles
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while fetching profile' }
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profiles
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    const allowedUpdates = [
      'fullName', 'phone', 'address', 'location'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: { ...user.toObject(), password: undefined } }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while updating profile' }
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/profiles/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
  try {
    // This would typically integrate with a file upload service like Cloudinary
    // For now, we'll just simulate the upload
    
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // In a real implementation, you would:
    // 1. Validate the uploaded file
    // 2. Upload to cloud storage (Cloudinary, AWS S3, etc.)
    // 3. Get the URL back and save it to the user profile

    const avatarUrl = 'https://via.placeholder.com/150'; // Placeholder for now
    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while uploading avatar' }
    });
  }
};

// @desc    Delete avatar
// @route   DELETE /api/profiles/avatar
// @access  Private
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // In a real implementation, you would also delete the file from cloud storage
    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar deleted successfully'
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Server error while deleting avatar' }
    });
  }
};
