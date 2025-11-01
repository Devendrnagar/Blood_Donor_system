import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Download, Eye, Shield, Award, Mail, Phone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../lib/apiService';
import Certificate from './Certificate';
import { PDFGenerator } from '../lib/pdfGenerator';
import { CertificateService } from '../lib/certificateService';

interface MyCertificatesResponse {
  certificates: UserCertificate[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface UserCertificate {
  id: string;
  certificate_id: string;
  status: 'active' | 'revoked';
  generated_at: string;
  download_count: number;
  verification_count: number;
  last_downloaded_at?: string;
  verification_url: string;
  blood_donations: {
    donation_date: string;
    blood_type: string;
    blood_unit_id?: string;
  };
  donation_centers: {
    name: string;
    city: string;
    state: string;
  };
}

const MyCertificates: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [showCertificateView, setShowCertificateView] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadMyCertificates = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's certificates from API
      const response = await apiService.getMyCertificates();
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to load certificates');
      }

      // Get certificates from response
      const responseData = response.data as MyCertificatesResponse;
      const certificatesArray = responseData?.certificates || [];
      setCertificates(certificatesArray);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadMyCertificates();
    }
  }, [user, loadMyCertificates]);

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      setDownloading(certificateId);
      
      // Get certificate data
      const certResponse = await CertificateService.verifyCertificate(certificateId);
      if (!certResponse.valid || !certResponse.certificate) {
        throw new Error('Certificate not found or invalid');
      }
      const certificateData = certResponse.certificate;
      if (!certificateData) {
        alert('Certificate not found');
        return;
      }

      // Generate and download PDF
      const pdfBlob = await PDFGenerator.generateCertificatePDF(certificateData);
      await PDFGenerator.downloadPDF(pdfBlob, `blood-donation-certificate-${certificateId}.pdf`);

      // Update download count via API
      try {
        await apiService.updateCertificate(certificateId, {
          downloadCount: (certificates.find(c => c.certificate_id === certificateId)?.download_count || 0) + 1,
          lastDownloadedAt: new Date().toISOString()
        });
      } catch (error) {
        console.log('Failed to update download count:', error);
      }

      // Reload certificates to update counts
      loadMyCertificates();
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleViewCertificate = (certificateId: string) => {
    setSelectedCertificate(certificateId);
    setShowCertificateView(true);
  };

  const handleShareCertificate = (verificationUrl: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Blood Donation Certificate',
        text: 'View my blood donation certificate',
        url: verificationUrl
      });
    } else {
      navigator.clipboard.writeText(verificationUrl);
      alert('Verification URL copied to clipboard!');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      revoked: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status === 'active' ? 'Valid' : 'Revoked'}
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Award className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Blood Donation Certificates</h1>
        <p className="text-gray-600">
          View, download, and share your blood donation certificates
        </p>
      </div>

      {/* Statistics */}
      {certificates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Award className="h-6 w-6 text-red-600" />
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
                <p className="text-sm text-gray-600">Active Certificates</p>
                <p className="text-xl font-bold text-gray-800">
                  {(Array.isArray(certificates) ? certificates : []).filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-xl font-bold text-gray-800">
                  {certificates.reduce((sum, cert) => sum + cert.download_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No Certificates Yet</h2>
          <p className="text-gray-500 mb-6">
            You haven't recorded any blood donations yet. Record your first donation to get your certificate!
          </p>
          <button
            onClick={() => window.location.href = '#donate'}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Record Donation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">Certificate</h3>
                    <p className="text-red-100 text-sm">{certificate.certificate_id}</p>
                  </div>
                  {getStatusBadge(certificate.status)}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Donation Date:</span>
                  <span>{new Date(certificate.blood_donations.donation_date).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Blood Type:</span>
                  <span className="font-semibold text-red-600">{certificate.blood_donations.blood_type}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Center:</span>
                  <span className="truncate">{certificate.donation_centers.name}</span>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Generated: {new Date(certificate.generated_at).toLocaleDateString()}</p>
                  <p>Downloads: {certificate.download_count} | Verifications: {certificate.verification_count}</p>
                  {certificate.last_downloaded_at && (
                    <p>Last downloaded: {new Date(certificate.last_downloaded_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => handleViewCertificate(certificate.certificate_id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                
                <button
                  onClick={() => handleDownloadCertificate(certificate.certificate_id)}
                  disabled={downloading === certificate.certificate_id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                >
                  <Download className="h-4 w-4" />
                  {downloading === certificate.certificate_id ? 'Downloading...' : 'Download'}
                </button>
                
                <button
                  onClick={() => handleShareCertificate(certificate.verification_url)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Phone className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">About Your Certificates</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            • All certificates are digitally signed and can be verified online using the QR code or verification URL.
          </p>
          <p>
            • Certificates are generated automatically when you record a blood donation.
          </p>
          <p>
            • You can download your certificates as PDF files for printing or sharing.
          </p>
          <p>
            • Each certificate has a unique ID that can be used for verification.
          </p>
          <p>
            • For any issues with your certificates, contact support at support@blooddonation.gov.in or call 1075.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyCertificates;
