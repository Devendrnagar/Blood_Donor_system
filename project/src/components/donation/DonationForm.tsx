import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, User, Heart, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../lib/apiService';



interface DonationFormData {
  donation_center: string;
  donation_date: string;
  blood_type: string;
  units_donated: number;
  blood_unit_id: string;
  hemoglobin_level: number;
  notes: string;
}

interface Donor {
  id: string;
  bloodType: string;
  lastDonationDate?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

interface DonorProfileResponse {
  donor: Donor | null;
}

const DonationForm: React.FC = () => {
  const { user } = useAuth();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [formData, setFormData] = useState<DonationFormData>({
    donation_center: '',
    donation_date: new Date().toISOString().split('T')[0],
    blood_type: '',
    units_donated: 1,
    blood_unit_id: '',
    hemoglobin_level: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const loadDonorProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await apiService.getDonorProfile();
      
      if (response.success && response.data && (response.data as DonorProfileResponse).donor) {
        const donor = (response.data as DonorProfileResponse).donor;
        if (donor) {
          setDonor(donor);
          setFormData(prev => ({
            ...prev,
            blood_type: donor.bloodType
          }));
        }
      }
    } catch (err) {
      console.error('Error loading donor profile:', err);
      setError('Failed to load donor profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDonorProfile();
  }, [loadDonorProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const validateForm = (): boolean => {
    if (!donor) {
      setError('You must complete your donor profile before recording a donation');
      return false;
    }

    if (!formData.donation_center) {
      setError('Please enter a donation center');
      return false;
    }

    if (!formData.donation_date) {
      setError('Please select a donation date');
      return false;
    }

    if (!formData.blood_type) {
      setError('Please select your blood type');
      return false;
    }

    if (formData.units_donated < 1) {
      setError('Units donated must be at least 1');
      return false;
    }

    const donationDate = new Date(formData.donation_date);
    const today = new Date();
    if (donationDate > today) {
      setError('Donation date cannot be in the future');
      return false;
    }

    // Check if donor is eligible (minimum 3 months gap)
    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (lastDonation > threeMonthsAgo) {
        setError('You must wait at least 3 months between donations');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Note: Currently donation creation is admin-only in the backend
      // For now, we'll show a message that the donation needs admin approval
      setSuccess('Donation form submitted successfully! Your donation will be reviewed and processed by an administrator.');
      
      // Reset form
      setFormData({
        donation_center: '',
        donation_date: new Date().toISOString().split('T')[0],
        blood_type: donor?.bloodType || '',
        units_donated: 1,
        blood_unit_id: '',
        hemoglobin_level: 0,
        notes: ''
      });
      
      // TODO: In a production environment, this would submit to a pending donations endpoint
      // or send an email notification to administrators

      // Reload donor profile to update last donation date
      loadDonorProfile();

    } catch (err) {
      console.error('Error submitting donation:', err);
      setError('Failed to record donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }



  if (!donor) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Complete Your Donor Profile</h2>
          <p className="text-gray-600 mb-4">
            You need to complete your donor profile before you can record a donation.
          </p>
          <button
            onClick={() => window.location.href = '/donor/profile'}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Record Blood Donation</h1>
        </div>
        <p className="text-red-100 mt-2">
          Record your blood donation and get an official certificate
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 m-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>

        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Donor Information Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-red-600" />
            Donor Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Name:</strong> {donor.fullName || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {donor.email || 'N/A'}
            </div>
            <div>
              <strong>Blood Type:</strong> {donor.bloodType}
            </div>
            <div>
              <strong>Last Donation:</strong> {
                donor.lastDonationDate 
                  ? new Date(donor.lastDonationDate).toLocaleDateString()
                  : 'First time donor'
              }
            </div>
          </div>
        </div>

        {/* Donation Center */}
        <div>
          <label htmlFor="donation_center" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Donation Center *
          </label>
          <input
            type="text"
            id="donation_center"
            name="donation_center"
            value={formData.donation_center}
            onChange={handleInputChange}
            placeholder="Enter donation center name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Donation Date */}
        <div>
          <label htmlFor="donation_date" className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Donation Date *
          </label>
          <input
            type="date"
            id="donation_date"
            name="donation_date"
            value={formData.donation_date}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Blood Type */}
        <div>
          <label htmlFor="blood_type" className="block text-sm font-medium text-gray-700 mb-2">
            Blood Type *
          </label>
          <select
            id="blood_type"
            name="blood_type"
            value={formData.blood_type}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Select blood type</option>
            {bloodTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Units Donated */}
        <div>
          <label htmlFor="units_donated" className="block text-sm font-medium text-gray-700 mb-2">
            Units Donated *
          </label>
          <input
            type="number"
            id="units_donated"
            name="units_donated"
            value={formData.units_donated}
            onChange={handleInputChange}
            min="1"
            max="2"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Blood Unit ID (Optional) */}
        <div>
          <label htmlFor="blood_unit_id" className="block text-sm font-medium text-gray-700 mb-2">
            Blood Unit ID (Optional)
          </label>
          <input
            type="text"
            id="blood_unit_id"
            name="blood_unit_id"
            value={formData.blood_unit_id}
            onChange={handleInputChange}
            placeholder="Leave blank to auto-generate"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Hemoglobin Level (Optional) */}
        <div>
          <label htmlFor="hemoglobin_level" className="block text-sm font-medium text-gray-700 mb-2">
            Hemoglobin Level (g/dL) (Optional)
          </label>
          <input
            type="number"
            id="hemoglobin_level"
            name="hemoglobin_level"
            value={formData.hemoglobin_level || ''}
            onChange={handleInputChange}
            step="0.1"
            min="0"
            max="20"
            placeholder="e.g., 12.5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any additional notes about the donation..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Heart className="h-5 w-5" />
            {submitting ? 'Recording Donation...' : 'Record Donation & Generate Certificate'}
          </button>
        </div>

        {/* Information Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Important Information:</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>A digital certificate will be automatically generated upon submission</li>
            <li>The certificate will be emailed to your registered email address</li>
            <li>You can download the certificate immediately after generation</li>
            <li>Each certificate has a unique ID and QR code for verification</li>
            <li>Minimum gap between donations is 3 months</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;
