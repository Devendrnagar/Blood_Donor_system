import React, { useState, useEffect, useCallback } from 'react';
import { Download, ExternalLink, Shield, Calendar, MapPin, User, Phone, Mail } from 'lucide-react';
import QRCode from 'react-qr-code';
import { CertificateService, CertificateData } from '../lib/certificateService';
import { PDFGenerator } from '../lib/pdfGenerator';

interface CertificateProps {
  certificateId: string;
  onClose?: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ certificateId, onClose }) => {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loadCertificate = useCallback(async () => {
    try {
      setLoading(true);
      const result = await CertificateService.verifyCertificate(certificateId);
      if (result.valid && result.certificate) {
        setCertificate(result.certificate);
      } else {
        setError(result.error || 'Certificate not found');
      }
    } catch (err) {
      setError('Error loading certificate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  const handleDownload = async () => {
    if (!certificate) return;
    
    try {
      setDownloading(true);
      const pdfBlob = await PDFGenerator.generateCertificatePDF(certificate);
      await PDFGenerator.downloadPDF(pdfBlob, `blood-donation-certificate-${certificate.certificateId}.pdf`);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Error downloading certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleVerify = () => {
    if (certificate) {
      window.open(certificate.verificationUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <Shield className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">{error || 'Certificate not found'}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Blood Donation Certificate</h1>
            <p className="text-red-100">Certificate ID: {certificate.certificateId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handleVerify}
              className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Verify Online
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="p-8">
        {/* Government Header */}
        <div className="text-center mb-8 border-b pb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">भारत सरकार</h2>
              <h3 className="text-lg text-gray-600">GOVERNMENT OF INDIA</h3>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-600">
            रक्तदान प्रमाणपत्र<br />
            BLOOD DONATION CERTIFICATE
          </h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Details */}
          <div className="lg:col-span-2">
            <div className="text-center mb-6">
              <p className="text-lg mb-2">
                यह प्रमाणित किया जाता है कि<br />
                <strong>This is to certify that</strong>
              </p>
              <h2 className="text-3xl font-bold text-red-600 underline mb-4">
                {certificate.donorName}
              </h2>
            </div>

            {/* Donor Information */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-red-600" />
                Donor Information / दाता की जानकारी
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span><strong>Age / आयु:</strong> {certificate.donorAge} years</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span><strong>Blood Group / रक्त समूह:</strong> {certificate.bloodType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span><strong>Phone / फोन:</strong> {certificate.donorPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span><strong>Email:</strong> {certificate.donorEmail}</span>
                </div>
                {certificate.donorAddress && (
                  <div className="md:col-span-2 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <span><strong>Address / पता:</strong> {certificate.donorAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Donation Details */}
            <div className="bg-red-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-red-600" />
                Donation Details / दान विवरण
              </h3>
              <div className="space-y-3 text-sm">
                <p><strong>Donation Date / दान दिनांक:</strong> {certificate.donationDate}</p>
                <p><strong>Donation Center / दान केंद्र:</strong> {certificate.donationCenterName}</p>
                <p><strong>Address / पता:</strong> {certificate.donationCenterAddress}</p>
                {certificate.bloodUnitId && (
                  <p><strong>Blood Unit ID:</strong> {certificate.bloodUnitId}</p>
                )}
              </div>
            </div>

            {/* Certificate Statement */}
            <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <p className="text-lg mb-3">
                ने दिनांक <strong>{certificate.donationDate}</strong> को स्वेच्छा से रक्तदान किया है।
              </p>
              <p className="text-lg font-semibold text-red-600">
                has voluntarily donated blood on {certificate.donationDate}.
              </p>
              <p className="text-sm italic text-gray-600 mt-4">
                रक्तदान महादान - आपका यह नेक कार्य किसी की जिंदगी बचा सकता है<br />
                <em>Blood donation is the greatest donation - Your noble act can save someone's life</em>
              </p>
            </div>

            {/* Signatory */}
            <div className="text-right">
              <div className="inline-block">
                {certificate.signatureImageUrl && (
                  <img
                    src={certificate.signatureImageUrl}
                    alt="Signature"
                    className="w-32 h-16 object-contain mb-2"
                  />
                )}
                <div className="border-t border-gray-400 pt-2">
                  <p className="font-semibold">{certificate.signatoryName}</p>
                  <p className="text-sm text-gray-600">{certificate.signatoryDesignation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code and Verification */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Certificate Verification</h3>
              <div className="bg-white p-4 rounded-lg border inline-block mb-4">
                <QRCode
                  value={JSON.stringify({
                    certificateId: certificate.certificateId,
                    verificationUrl: certificate.verificationUrl
                  })}
                  size={150}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan QR code or visit the verification URL to verify this certificate
              </p>
              <button
                onClick={handleVerify}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Verify Certificate
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Certificate ID: {certificate.certificateId}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
          <p>
            For queries: support@blooddonation.gov.in | Helpline: 1075<br />
            <em>This is a digitally generated certificate. No signature is required for validation.</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
