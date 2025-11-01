import React, { useState, useEffect } from 'react';
import { Shield, Search, Eye, Ban, RefreshCw, Mail } from 'lucide-react';
import { apiService } from '../../lib/apiService';
import { CertificateService } from '../../lib/certificateService';
import Certificate from '../Certificate';

interface CertificateRecord {
  id: string;
  certificate_id: string;
  status: 'active' | 'revoked';
  generated_at: string;
  email_sent_status: 'pending' | 'sent' | 'failed';
  download_count: number;
  verification_count: number;
  last_downloaded_at?: string;
  last_verified_at?: string;
  revoked_at?: string;
  revoked_reason?: string;
  blood_donations: {
    donation_date: string;
    blood_type: string;
    blood_unit_id?: string;
  };
  donors: {
    age: number;
    profiles: {
      full_name: string;
      email: string;
      phone: string;
    };
  };
  donation_centers: {
    name: string;
    city: string;
    state: string;
  };
}

const CertificateManagement: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [showCertificateView, setShowCertificateView] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCertificates = async () => {
    try {
      setLoading(true);
      
      const params: Record<string, unknown> = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await apiService.getCertificates(params);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to load certificates');
      }

      setCertificates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = (Array.isArray(certificates) ? certificates : []).filter(cert => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      cert.certificate_id.toLowerCase().includes(search) ||
      cert.donors.profiles.full_name.toLowerCase().includes(search) ||
      cert.donors.profiles.email.toLowerCase().includes(search) ||
      cert.donation_centers.name.toLowerCase().includes(search)
    );
  });

  const handleRevokeCertificate = async (certificateId: string) => {
    if (!revokeReason.trim()) {
      alert('Please provide a reason for revocation');
      return;
    }

    try {
      await CertificateService.revokeCertificate(certificateId, revokeReason);
      
      alert('Certificate revoked successfully');
      loadCertificates();
      setShowRevokeModal(null);
      setRevokeReason('');
    } catch (error) {
      console.error('Error revoking certificate:', error);
      alert('Error revoking certificate');
    }
  };

  const handleResendEmail = async (certificateId: string) => {
    try {
      setResendingEmail(certificateId);
      
      // In a real application, this would trigger the email service
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update email sent status via API
      await apiService.updateCertificate(certificateId, {
        emailSentAt: new Date().toISOString(),
        emailSentStatus: 'sent'
      });

      alert('Email resent successfully');
      loadCertificates();
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Error resending email');
    } finally {
      setResendingEmail(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      revoked: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getEmailStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      sent: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (showCertificateView && selectedCertificate) {
    return (
      <Certificate
        certificateId={selectedCertificate}
        onClose={() => {
          setShowCertificateView(false);
          setSelectedCertificate(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Certificate Management</h1>
          <p className="text-gray-600">Manage blood donation certificates</p>
        </div>
        <button
          onClick={loadCertificates}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by certificate ID, donor name, email, or center..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'revoked')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Certificates</p>
              <p className="text-xl font-bold text-gray-800">{certificates.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-800">
                {(Array.isArray(certificates) ? certificates : []).filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Revoked</p>
              <p className="text-xl font-bold text-gray-800">
                {(Array.isArray(certificates) ? certificates : []).filter(c => c.status === 'revoked').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Mail className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Email Pending</p>
              <p className="text-xl font-bold text-gray-800">
                {(Array.isArray(certificates) ? certificates : []).filter(c => c.email_sent_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-800">Certificate ID</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Donor</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Donation</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Center</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Email</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Stats</th>
                  <th className="text-left p-4 font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{cert.certificate_id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(cert.generated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{cert.donors.profiles.full_name}</p>
                        <p className="text-sm text-gray-500">{cert.donors.profiles.email}</p>
                        <p className="text-sm text-gray-500">{cert.donors.profiles.phone}</p>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{cert.blood_donations.blood_type}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(cert.blood_donations.donation_date).toLocaleDateString()}
                        </p>
                        {cert.blood_donations.blood_unit_id && (
                          <p className="text-xs text-gray-400">{cert.blood_donations.blood_unit_id}</p>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-800">{cert.donation_centers.name}</p>
                        <p className="text-sm text-gray-500">
                          {cert.donation_centers.city}, {cert.donation_centers.state}
                        </p>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      {getStatusBadge(cert.status)}
                      {cert.status === 'revoked' && cert.revoked_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(cert.revoked_at).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    
                    <td className="p-4">
                      <div className="space-y-1">
                        {getEmailStatusBadge(cert.email_sent_status)}
                        {cert.email_sent_status === 'pending' && (
                          <button
                            onClick={() => handleResendEmail(cert.certificate_id)}
                            disabled={resendingEmail === cert.certificate_id}
                            className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50"
                          >
                            {resendingEmail === cert.certificate_id ? 'Sending...' : 'Resend'}
                          </button>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="text-sm text-gray-600">
                        <p>Downloads: {cert.download_count}</p>
                        <p>Verifications: {cert.verification_count}</p>
                        {cert.last_verified_at && (
                          <p className="text-xs">
                            Last verified: {new Date(cert.last_verified_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCertificate(cert.certificate_id);
                            setShowCertificateView(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Certificate"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {cert.status === 'active' && (
                          <button
                            onClick={() => setShowRevokeModal(cert.certificate_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Revoke Certificate"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCertificates.length === 0 && !loading && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No certificates found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Revoke Certificate</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to revoke certificate {showRevokeModal}? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label htmlFor="revokeReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for revocation *
              </label>
              <textarea
                id="revokeReason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                placeholder="Please provide a reason for revocation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleRevokeCertificate(showRevokeModal)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Revoke Certificate
              </button>
              <button
                onClick={() => {
                  setShowRevokeModal(null);
                  setRevokeReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagement;
