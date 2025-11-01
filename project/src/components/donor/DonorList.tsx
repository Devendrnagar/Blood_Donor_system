import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../lib/apiService';
import { Droplet, MapPin, Phone, User } from 'lucide-react';

interface Donor {
  id: string;
  user_id: string;
  blood_type: string;
  age: number;
  available: boolean;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance?: number;
  profile?: {
    full_name: string;
    phone: string | null;
  };
}

interface RawDonorData {
  id: string;
  user_id: string;
  blood_type: string;
  age: number;
  available: boolean;
  city: string;
  state: string;
  fullName?: string;
  phone?: string;
  location?: {
    coordinates?: [number, number];
  };
}

interface DonorListProps {
  bloodTypeFilter?: string;
  userLocation?: { lat: number; lng: number };
}

export default function DonorList({ bloodTypeFilter, userLocation }: DonorListProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const filters: Record<string, unknown> = { available: true };
      if (bloodTypeFilter && bloodTypeFilter !== 'All') {
        filters.bloodType = bloodTypeFilter;
      }

      const response = await apiService.getDonors(filters);
      
      if (!response.success) {
        setError(response.error?.message || 'Failed to fetch donors');
        setLoading(false);
        return;
      }

      const rawDonors = Array.isArray(response.data) ? response.data : [];
      const donorsWithDistance = rawDonors.map((donor: RawDonorData): Donor => {
        const donorData: Donor = {
          ...donor,
          profile: {
            full_name: donor.fullName || 'Unknown',
            phone: donor.phone || 'Not provided'
          },
          latitude: donor.location?.coordinates?.[1] || 0,
          longitude: donor.location?.coordinates?.[0] || 0
        };

        if (userLocation && donorData.latitude && donorData.longitude) {
          donorData.distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            donorData.latitude,
            donorData.longitude
          );
        }

        return donorData;
      });

      if (userLocation) {
        donorsWithDistance.sort((a: Donor, b: Donor) => (a.distance || 0) - (b.distance || 0));
      }

      setDonors(donorsWithDistance);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch donors');
    } finally {
      setLoading(false);
    }
  }, [bloodTypeFilter, userLocation]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No donors available at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {donors.map((donor) => (
        <div key={donor.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Droplet className="w-6 h-6 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{donor.blood_type}</span>
            </div>
            {donor.distance !== undefined && (
              <div className="text-sm text-gray-600">
                {donor.distance.toFixed(1)} km away
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              <span>{donor.profile?.full_name || 'Anonymous'}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4" />
              <span>{donor.city}, {donor.state}</span>
            </div>

            {donor.profile?.phone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                <span>{donor.profile.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Available
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
