import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Calendar, MapPin, User, ExternalLink } from 'lucide-react';
import { CertificateService } from '../lib/certificateService';

interface VerificationResult {
  valid: boolean;
  message?: string;
  certificateId?: string;
  donorName?: string;
  donationDate?: string;
  bloodType?: string;
  donationCenter?: string;
  location?: string;
  verifiedAt?: string;
}

const CertificateVerification: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualCertId, setManualCertId] = useState('');

  useEffect(() => {
    if (certificateId) {
      verifyCertificate(certificateId);
    } else {
      setLoading(false);
    }
  }, [certificateId]);

  const verifyCertificate = async (certId: string) => {
    try {
      setLoading(true);
      const verificationResult = await CertificateService.verifyCertificate(certId);
      setResult(verificationResult);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        valid: false,
        message: 'Error occurred during verification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCertId.trim()) {
      verifyCertificate(manualCertId.trim());
      setManualCertId('');
    }
  };

  const copyVerificationUrl = () => {
    const url = `${window.location.origin}/verify/${certificateId || manualCertId}`;
    navigator.clipboard.writeText(url);
    alert('Verification URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Certificate Verification</h1>
          <p className="text-gray-600">
            Verify the authenticity of blood donation certificates issued by Government of India
          </p>
        </div>

        {/* Manual Verification Form */}
        {!certificateId && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Enter Certificate ID</h2>
            <form onSubmit={handleManualVerification} className="space-y-4">
              <div>
                <label htmlFor="certId" className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate ID (e.g., BDC-2025-000123)
                </label>
                <input
                  type="text"
                  id="certId"
                  value={manualCertId}
                  onChange={(e) => setManualCertId(e.target.value)}
                  placeholder="Enter certificate ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />
                {loading ? 'Verifying...' : 'Verify Certificate'}
              </button>
            </form>
          </div>
        )}

        {/* Verification Result */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying certificate...</p>
            </div>
          ) : result ? (
            <div className="text-center">
              {result.valid ? (
                <div>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-600 mb-2">Certificate Valid</h2>
                  <p className="text-gray-600 mb-6">This blood donation certificate is authentic and verified.</p>
                  
                  {/* Certificate Details */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Certificate Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span><strong>Certificate ID:</strong> {result.certificateId}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-green-600" />
                        <span><strong>Donor Name:</strong> {result.donorName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <span><strong>Donation Date:</strong> {result.donationDate}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span><strong>Blood Type:</strong> {result.bloodType}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <span><strong>Donation Center:</strong> {result.donationCenter}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <span><strong>Location:</strong> {result.location}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <span><strong>Verified At:</strong> {new Date(result.verifiedAt!).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Badge */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Verified by Government of India</span>
                    </div>
                    <p className="text-sm text-green-100">
                      This certificate has been digitally verified and is authentic.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Certificate Invalid</h2>
                  <p className="text-gray-600 mb-4">
                    {result.message || 'This certificate could not be verified.'}
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-left">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Possible Reasons:</h3>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>Certificate ID is incorrect or invalid</li>
                      <li>Certificate has been revoked</li>
                      <li>Certificate does not exist in our database</li>
                      <li>Technical error occurred during verification</li>
                    </ul>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> If you believe this certificate should be valid, 
                      please contact our support team at <strong>support@blooddonation.gov.in</strong> 
                      or call our helpline at <strong>1075</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={copyVerificationUrl}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Copy Verification URL
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setManualCertId('');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Verify Another Certificate
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Ready to Verify</h2>
              <p className="text-gray-500">
                Enter a certificate ID above or scan a QR code to verify a blood donation certificate.
              </p>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">About Certificate Verification</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              • All blood donation certificates issued by authorized centers are digitally signed and can be verified online.
            </p>
            <p>
              • Verification is free and available 24/7 for public access.
            </p>
            <p>
              • Each certificate has a unique ID and QR code for easy verification.
            </p>
            <p>
              • For technical support, contact us at support@blooddonation.gov.in or call 1075.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerification;
