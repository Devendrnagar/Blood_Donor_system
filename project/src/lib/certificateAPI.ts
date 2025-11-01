import { apiService } from '../lib/apiService';

export interface Certificate {
  id: string;
  certificateId: string;
  donationId: string;
  donorName: string;
  donationDate: string;
  bloodType: string;
  verificationUrl: string;
  qrCodeData: string;
  status: 'issued' | 'revoked';
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

interface DonationData {
  donorId: string;
  donationDate: string;
  bloodType: string;
  [key: string]: unknown;
}

interface DonorData {
  fullName: string;
  [key: string]: unknown;
}

export const certificateAPI = {
  async getCertificate(certificateId: string): Promise<Certificate | null> {
    try {
      const response = await apiService.getCertificateById(certificateId);
      
      if (response.success && response.data) {
        return response.data as Certificate;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  },

  async updateCertificateStatus(
    certificateId: string, 
    status: 'issued' | 'revoked', 
    reason?: string
  ): Promise<void> {
    try {
      const updateData: {
        status: 'issued' | 'revoked';
        revokedAt?: string;
        revocationReason?: string;
      } = {
        status,
        ...(status === 'revoked' && { 
          revokedAt: new Date().toISOString(),
          revocationReason: reason 
        })
      };

      const response = await apiService.updateCertificate(certificateId, updateData);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update certificate status');
      }
    } catch (error) {
      console.error('Error updating certificate status:', error);
      throw error;
    }
  },

  async generateCertificate(donationId: string): Promise<Certificate> {
    try {
      // Get donation details first
      const donationResponse = await apiService.getDonationById(donationId);
      
      if (!donationResponse.success) {
        throw new Error('Donation not found');
      }

      const donation = donationResponse.data as DonationData;
      
      // Get donor details
      const donorResponse = await apiService.getDonorById(donation.donorId);
      if (!donorResponse.success) {
        throw new Error('Donor not found');
      }
      
      const donor = donorResponse.data as DonorData;
      
      // Generate certificate
      const certificateData = {
        donationId,
        donorName: donor.fullName,
        donationDate: donation.donationDate,
        bloodType: donation.bloodType,
        status: 'issued' as const,
        issuedAt: new Date().toISOString()
      };

      const response = await apiService.createCertificate(certificateData);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to generate certificate');
      }

      return response.data as Certificate;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  },

  async verifyCertificate(certificateId: string): Promise<{
    valid: boolean;
    certificate?: Certificate;
    error?: string;
  }> {
    try {
      const response = await apiService.getCertificateById(certificateId);
      
      if (!response.success) {
        return {
          valid: false,
          error: 'Certificate not found'
        };
      }

      const certificate = response.data as Certificate;
      
      if (certificate.status !== 'issued') {
        return {
          valid: false,
          error: 'Certificate has been revoked or is invalid'
        };
      }

      return {
        valid: true,
        certificate
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return {
        valid: false,
        error: 'Verification failed'
      };
    }
  },

  async deleteCertificate(certificateId: string): Promise<void> {
    try {
      const response = await apiService.deleteCertificate(certificateId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  }
};

export default certificateAPI;
