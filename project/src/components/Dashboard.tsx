import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../lib/apiService';
import DonorForm from './donor/DonorForm';
import DonorList from './donor/DonorList';
import DonorMap from './donor/DonorMap';
import RequestForm from './request/RequestForm';
import RequestList from './request/RequestList';
import DonationForm from './donation/DonationForm';
import CertificateManagement from './admin/CertificateManagement';
import CertificateVerification from './CertificateVerification';
import MyCertificates from './MyCertificates';
import BloodInventoryDashboard from './BloodInventoryDashboard';
import { Droplet, Heart, LogOut, Menu, X, Award, Shield, FileText, BarChart3 } from 'lucide-react';

const BLOOD_TYPES = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Type definitions
interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

// DonorMap expects this structure
interface Donor {
  id: string;
  blood_type: string;
  latitude: number;
  longitude: number;
  city: string;
  profile?: {
    full_name: string;
  };
}

// Raw donor data from API
interface RawDonor {
  _id: string;
  id?: string;
  user?: User;
  bloodType?: string;
  blood_type?: string;
  age: number;
  weight: number;
  gender: string;
  location?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  latitude?: number;
  longitude?: number;
  city?: string;
  fullName?: string;
  isAvailable: boolean;
  lastDonationDate?: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'donors' | 'requests' | 'become-donor' | 'donate' | 'my-certificates' | 'certificates' | 'verify'>('inventory');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('All');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;



  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const response = await apiService.getMe();
        if (response.success && response.data) {
          const userData = response.data as { user?: User };
          if (userData.user) {
            setProfile({ full_name: userData.user.fullName });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
    getUserLocation();
  }, [user]);

  useEffect(() => {
    const fetchDonorsForMap = async () => {
      try {
        const filters: Record<string, unknown> = { available: true };
        if (bloodTypeFilter !== 'All') {
          filters.bloodType = bloodTypeFilter;
        }

        const response = await apiService.getDonors(filters);
        
        if (response.success && response.data) {
          const rawDonors = response.data as RawDonor[];
          // Transform the data to match the expected structure for DonorMap
          const transformedDonors = rawDonors.map((donor: RawDonor) => ({
            id: donor._id || donor.id || '',
            blood_type: donor.bloodType || donor.blood_type || '',
            latitude: donor.location?.coordinates?.[1] || donor.latitude || 0,
            longitude: donor.location?.coordinates?.[0] || donor.longitude || 0,
            city: donor.location?.address || donor.city || 'Unknown',
            profile: {
              full_name: donor.user?.fullName || donor.fullName || 'Unknown'
            }
          }));
          setDonors(transformedDonors);
        }
      } catch (error) {
        console.error('Error fetching donors:', error);
      }
    };

    if (activeTab === 'donors') {
      fetchDonorsForMap();
    }
  }, [activeTab, bloodTypeFilter]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 0, lng: 0 });
        }
      );
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-600" />
              <h1 className="text-xl font-bold text-gray-800">Blood Donation System</h1>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <span className="text-gray-700">Welcome, {profile?.full_name || 'User'}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="text-gray-700 mb-2">Welcome, {profile?.full_name || 'User'}</div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'inventory'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Blood Inventory
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'donors'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Droplet className="w-5 h-5" />
            Find Donors
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className="w-5 h-5" />
            Blood Requests
          </button>
          <button
            onClick={() => setActiveTab('become-donor')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'become-donor'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className="w-5 h-5" />
            Become a Donor
          </button>
          <button
            onClick={() => setActiveTab('donate')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'donate'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Award className="w-5 h-5" />
            Record Donation
          </button>
          <button
            onClick={() => setActiveTab('my-certificates')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'my-certificates'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Award className="w-5 h-5" />
            My Certificates
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'certificates'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Shield className="w-5 h-5" />
            Manage Certificates
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'verify'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Verify Certificate
          </button>
        </div>

        <div className="mb-6">
          {activeTab === 'inventory' && (
            <BloodInventoryDashboard />
          )}

          {activeTab === 'donors' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Blood Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setBloodTypeFilter(type)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        bloodTypeFilter === type
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {userLocation && donors.length > 0 && (
                <DonorMap
                  donors={donors}
                  center={userLocation}
                  apiKey={googleMapsApiKey}
                />
              )}

              <DonorList
                bloodTypeFilter={bloodTypeFilter}
                userLocation={userLocation || undefined}
              />
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              <RequestForm onSuccess={() => window.location.reload()} />
              <RequestList />
            </div>
          )}

          {activeTab === 'become-donor' && (
            <DonorForm onSuccess={() => setActiveTab('donors')} />
          )}

          {activeTab === 'donate' && (
            <DonationForm />
          )}

          {activeTab === 'my-certificates' && (
            <MyCertificates />
          )}

          {activeTab === 'certificates' && (
            <CertificateManagement />
          )}

          {activeTab === 'verify' && (
            <CertificateVerification />
          )}
        </div>
      </div>
    </div>
  );
}
