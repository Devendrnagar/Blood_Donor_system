import { useState, useEffect } from 'react';
import { apiService } from '../../lib/apiService';
import { AlertCircle, Clock, MapPin, Phone, User } from 'lucide-react';

interface BloodRequest {
  id: string;
  requester_id: string;
  blood_type: string;
  units_needed: number;
  urgency: string;
  patient_name: string;
  hospital_name: string;
  hospital_address: string;
  contact_phone: string;
  status: string;
  created_at: string;
  requesterName?: string;
  profile?: {
    full_name: string;
  };
}

export default function RequestList() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'urgent'>('open');

  useEffect(() => {
    fetchRequests();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const params: Record<string, unknown> = {};
      
      if (filter === 'open') {
        params.status = 'open';
      } else if (filter === 'urgent') {
        params.status = 'open';
        params.urgency = ['high', 'critical'];
      }

      const response = await apiService.getBloodRequests(params);

      if (response.success && response.data && Array.isArray(response.data)) {
        const requestsWithProfile = response.data.map((request: BloodRequest) => ({
          ...request,
          profile: {
            full_name: request.requesterName || 'Unknown'
          }
        }));
        setRequests(requestsWithProfile);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      emergency: 'bg-red-100 text-red-800 border-red-200',
      urgent: 'bg-orange-100 text-orange-800 border-orange-200',
      normal: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[urgency as keyof typeof styles]}`}>
        {urgency === 'emergency' && <AlertCircle className="w-3 h-3 mr-1" />}
        {urgency.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'open'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Open Requests
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'urgent'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Urgent Only
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Requests
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No blood requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-red-600"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-red-600">
                    {request.blood_type}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Units needed</div>
                    <div className="text-lg font-semibold">{request.units_needed}</div>
                  </div>
                </div>
                {getUrgencyBadge(request.urgency)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Patient:</span>
                  <span>{request.patient_name}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{request.hospital_name}</div>
                    <div className="text-sm text-gray-600">{request.hospital_address}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" />
                  <span>{request.contact_phone}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(request.created_at)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  Requested by: {request.profile?.full_name || 'Anonymous'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
