import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../lib/apiService';
import { AlertCircle, MapPin } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];

interface RequestFormProps {
  onSuccess: () => void;
}

export default function RequestForm({ onSuccess }: RequestFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    bloodType: 'O+',
    unitsNeeded: '1',
    urgency: 'medium',
    patientName: '',
    hospitalName: '',
    hospitalAddress: '',
    hospitalCity: '',
    hospitalState: '',
    hospitalPhone: '',
    contactPhone: '',
    contactEmail: '',
    requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
    description: '',
    latitude: 0,
    longitude: 0,
  });

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
      setError('Please get location for the hospital');
      setLoading(false);
      return;
    }

    if (!formData.hospitalCity || !formData.hospitalState || !formData.hospitalPhone) {
      setError('Please fill in all hospital details');
      setLoading(false);
      return;
    }

    // Validate required by date if provided
    if (formData.requiredBy) {
      const selectedDate = new Date(formData.requiredBy);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate < today) {
        setError('Required by date must be today or in the future');
        setLoading(false);
        return;
      }
    }

    try {
      // Calculate required by date (default to 7 days from now if not specified)
      let requiredByDate;
      if (formData.requiredBy) {
        // If user provided a date, set it to end of that day to ensure it's in the future
        requiredByDate = new Date(formData.requiredBy + 'T23:59:59.999Z');
      } else {
        // Default to 7 days from now
        requiredByDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      // Ensure the date is in the future
      if (requiredByDate <= new Date()) {
        requiredByDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      }

      const response = await apiService.createBloodRequest({
        bloodType: formData.bloodType,
        unitsNeeded: parseInt(formData.unitsNeeded),
        urgency: formData.urgency,
        patientName: formData.patientName,
        requiredBy: requiredByDate.toISOString(),
        hospital: {
          name: formData.hospitalName,
          address: {
            street: formData.hospitalAddress,
            city: formData.hospitalCity,
            state: formData.hospitalState,
            country: 'India'
          },
          phone: formData.hospitalPhone,
          contactPerson: ''
        },
        location: {
          coordinates: [formData.longitude, formData.latitude]
        },
        description: formData.description,
        contactInfo: {
          phone: formData.contactPhone,
          email: formData.contactEmail || user.email,
          alternatePhone: ''
        }
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create blood request');
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create blood request');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-800">Create Blood Request</h2>
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
              Blood Type Needed
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
              Units Needed
            </label>
            <input
              type="number"
              value={formData.unitsNeeded}
              onChange={(e) => setFormData({ ...formData, unitsNeeded: e.target.value })}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Urgency Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {URGENCY_LEVELS.map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, urgency: level })}
                className={`px-4 py-2 rounded-md border-2 transition-all ${
                  formData.urgency === level
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className={`font-medium capitalize ${getUrgencyColor(level)}`}>
                  {level}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required By Date *
            </label>
            <input
              type="date"
              value={formData.requiredBy}
              onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              When do you need the blood by?
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email (Optional)
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="Leave blank to use your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital Name
          </label>
          <input
            type="text"
            value={formData.hospitalName}
            onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital Address
          </label>
          <input
            type="text"
            value={formData.hospitalAddress}
            onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
            placeholder="Street address"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital City
            </label>
            <input
              type="text"
              value={formData.hospitalCity}
              onChange={(e) => setFormData({ ...formData, hospitalCity: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital State
            </label>
            <input
              type="text"
              value={formData.hospitalState}
              onChange={(e) => setFormData({ ...formData, hospitalState: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital Phone
          </label>
          <input
            type="tel"
            value={formData.hospitalPhone}
            onChange={(e) => setFormData({ ...formData, hospitalPhone: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Details (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder="Any additional details about the requirement..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="text-xs text-gray-500 mt-1">
            {formData.description.length}/500 characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hospital Location
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Get Location
            </button>
            {formData.latitude !== 0 && formData.longitude !== 0 && (
              <div className="flex items-center text-sm text-gray-600">
                {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
