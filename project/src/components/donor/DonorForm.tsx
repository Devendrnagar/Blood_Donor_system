import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../lib/apiService';
import { formatDateForInput } from '../../lib/dateUtils';
import { Droplet, MapPin } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface DonorFormProps {
  onSuccess: () => void;
}

interface DonorProfile {
  bloodType: string;
  age?: number;
  weight?: number;
  lastDonationDate?: string;
  available: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  location?: {
    coordinates?: [number, number];
  };
}

interface DonorProfileResponse {
  donor: DonorProfile | null;
}

export default function DonorForm({ onSuccess }: DonorFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingDonor, setExistingDonor] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    bloodType: 'O+',
    age: '',
    weight: '',
    gender: 'male',
    lastDonationDate: '',
    available: true,
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: 0,
    longitude: 0,
    // Medical History
    hasChronicIllness: false,
    chronicIllnessDetails: '',
    currentMedications: '',
    allergies: '',
    hasRecentSurgery: false,
    recentSurgeryDetails: '',
    hasInfectiousDiseases: false,
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    // Contact Preferences
    emailNotifications: true,
    phoneNotifications: true,
    smsNotifications: false,
  });

  const checkExistingDonor = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiService.getDonorProfile();
      if (response.success && response.data) {
        const donor = (response.data as DonorProfileResponse)?.donor;
        if (donor) {
          // User has an existing donor profile
          setExistingDonor(true);
          setFormData({
            bloodType: donor.bloodType || 'O+',
            age: donor.age?.toString() || '',
            weight: donor.weight?.toString() || '',
            gender: 'male', // Default value since existing data may not have this
            lastDonationDate: formatDateForInput(donor.lastDonationDate) || '',
            available: donor.available ?? true,
            address: donor.address?.street || '',
            city: donor.address?.city || '',
            state: donor.address?.state || '',
            zipCode: '', // Default value since existing data may not have this
            latitude: donor.location?.coordinates?.[1] || 0,
            longitude: donor.location?.coordinates?.[0] || 0,
            // Medical History defaults
            hasChronicIllness: false,
            chronicIllnessDetails: '',
            currentMedications: '',
            allergies: '',
            hasRecentSurgery: false,
            recentSurgeryDetails: '',
            hasInfectiousDiseases: false,
            // Emergency Contact defaults
            emergencyContactName: '',
            emergencyContactPhone: '',
            emergencyContactRelationship: '',
            // Contact Preferences defaults
            emailNotifications: true,
            phoneNotifications: true,
            smsNotifications: false,
          });
        } else {
          // User doesn't have a donor profile yet
          setExistingDonor(false);
        }
      }
    } catch (error) {
      console.error('Error checking existing donor:', error);
      setExistingDonor(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingDonor();
    }
  }, [user, checkExistingDonor]);

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setLoading(false);
        },
        () => {
          setError('Unable to get location. Please enter manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('Please get your current location or enter coordinates');
      setLoading(false);
      return;
    }

    // Validate conditional required fields
    if (formData.hasChronicIllness && !formData.chronicIllnessDetails.trim()) {
      setError('Please provide details about your chronic illness');
      setLoading(false);
      return;
    }

    if (formData.hasRecentSurgery && !formData.recentSurgeryDetails.trim()) {
      setError('Please provide details about your recent surgery');
      setLoading(false);
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[\d\-() ]+$/;
    if (!phoneRegex.test(formData.emergencyContactPhone)) {
      setError('Please enter a valid emergency contact phone number');
      setLoading(false);
      return;
    }

    const donorData = {
      bloodType: formData.bloodType,
      age: parseInt(formData.age),
      weight: parseFloat(formData.weight),
      gender: formData.gender,
      lastDonationDate: formData.lastDonationDate || null,
      isAvailable: formData.available,
      medicalHistory: {
        hasChronicIllness: formData.hasChronicIllness,
        chronicIllnessDetails: formData.hasChronicIllness ? formData.chronicIllnessDetails : '',
        currentMedications: formData.currentMedications ? formData.currentMedications.split(',').map(med => med.trim()).filter(med => med) : [],
        allergies: formData.allergies ? formData.allergies.split(',').map(allergy => allergy.trim()).filter(allergy => allergy) : [],
        hasRecentSurgery: formData.hasRecentSurgery,
        recentSurgeryDetails: formData.hasRecentSurgery ? formData.recentSurgeryDetails : '',
        hasInfectiousDiseases: formData.hasInfectiousDiseases
      },
      address: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: 'India'
      },
      location: {
        coordinates: [formData.longitude, formData.latitude]
      },
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship
      },
      contactPreferences: {
        email: formData.emailNotifications,
        phone: formData.phoneNotifications,
        sms: formData.smsNotifications
      }
    };

    try {
      // Debug: Log the data being sent
      console.log('Sending donor data:', JSON.stringify(donorData, null, 2));
      
      let response;
      if (existingDonor) {
        response = await apiService.updateDonor(donorData);
      } else {
        response = await apiService.registerDonor(donorData);
      }

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error?.message || 'Failed to save donor information');
      }
    } catch (error) {
      console.error('Full error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to save donor information');
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Droplet className="w-6 h-6 text-red-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-800">
          {existingDonor ? 'Update' : 'Register as'} Donor
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Type
            </label>
            <select
              value={formData.bloodType}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {BLOOD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              min="18"
              max="65"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
              min="50"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Donation Date
            </label>
            <input
              type="date"
              value={formatDateForInput(formData.lastDonationDate)}
              onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Street address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              value={formData.zipCode || ''}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Get Current Location
            </button>
            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <div className="flex items-center text-sm text-gray-600">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        {/* Medical History Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical History</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasChronicIllness"
                checked={formData.hasChronicIllness}
                onChange={(e) => setFormData({ ...formData, hasChronicIllness: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="hasChronicIllness" className="ml-2 text-sm text-gray-700">
                Do you have any chronic illness?
              </label>
            </div>

            {formData.hasChronicIllness && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chronic Illness Details
                </label>
                <textarea
                  value={formData.chronicIllnessDetails || ''}
                  onChange={(e) => setFormData({ ...formData, chronicIllnessDetails: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Medications (comma-separated)
              </label>
              <input
                type="text"
                value={formData.currentMedications || ''}
                onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter medications separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies (comma-separated)
              </label>
              <input
                type="text"
                value={formData.allergies || ''}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter allergies separated by commas"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasRecentSurgery"
                checked={formData.hasRecentSurgery}
                onChange={(e) => setFormData({ ...formData, hasRecentSurgery: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="hasRecentSurgery" className="ml-2 text-sm text-gray-700">
                Have you had any recent surgery?
              </label>
            </div>

            {formData.hasRecentSurgery && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recent Surgery Details
                </label>
                <textarea
                  value={formData.recentSurgeryDetails || ''}
                  onChange={(e) => setFormData({ ...formData, recentSurgeryDetails: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="hasInfectiousDiseases"
                checked={formData.hasInfectiousDiseases}
                onChange={(e) => setFormData({ ...formData, hasInfectiousDiseases: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="hasInfectiousDiseases" className="ml-2 text-sm text-gray-700">
                Do you have any infectious diseases?
              </label>
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.emergencyContactName || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.emergencyContactPhone || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={formData.emergencyContactRelationship || ''}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Spouse, Parent, Sibling, Friend"
              />
            </div>
          </div>
        </div>

        {/* Contact Preferences Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Preferences</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={formData.emailNotifications}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                Email notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="phoneNotifications"
                checked={formData.phoneNotifications}
                onChange={(e) => setFormData({ ...formData, phoneNotifications: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="phoneNotifications" className="ml-2 text-sm text-gray-700">
                Phone notifications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="smsNotifications"
                checked={formData.smsNotifications}
                onChange={(e) => setFormData({ ...formData, smsNotifications: e.target.checked })}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="smsNotifications" className="ml-2 text-sm text-gray-700">
                SMS notifications
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="available"
            checked={formData.available}
            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="available" className="ml-2 text-sm text-gray-700">
            Available for donation
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : existingDonor ? 'Update Profile' : 'Register as Donor'}
        </button>
      </form>
    </div>
  );
}
