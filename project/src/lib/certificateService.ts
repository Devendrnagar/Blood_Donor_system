import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { apiService } from './apiService';

// Type definitions for API responses
interface Address {
  street?: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
}

interface DonationCenter {
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface Donor {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address?: Address;
  bloodType: string;
  age: number;
  weight: number;
}

interface Donation {
  id: string;
  donorId: string;
  donationDate: string;
  bloodType: string;
  unitsDonated?: number;
  volumeDonated?: number;
  bloodUnitId?: string;
  donationCenter?: DonationCenter;
  hemoglobinLevel?: number;
  notes?: string;
}

interface Certificate {
  certificateId: string;
  donationId: string;
  donorName?: string;
  donationDate?: string;
  bloodType?: string;
  verificationUrl: string;
  qrCodeData: string;
  status: string;
  issuedAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

export interface DonationData {
  donorId: string;
  donationCenterId: string;
  donationDate: string;
  bloodType: string;
  unitsDonated: number;
  bloodUnitId?: string;
  hemoglobinLevel?: number;
  notes?: string;
}

export interface CertificateData {
  certificateId: string;
  donorName: string;
  donorAge: number;
  donorGender: string;
  donorPhone: string;
  donorEmail: string;
  donorAddress?: string;
  donationDate: string;
  bloodType: string;
  donationCenterName: string;
  donationCenterAddress: string;
  bloodUnitId?: string;
  verificationUrl: string;
  qrCodeData: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatureImageUrl?: string;
}

export class CertificateService {
  private static readonly DOMAIN = window.location.origin;
  
  static async createDonationRecord(donationData: DonationData): Promise<{ donationId: string; certificateId: string }> {
    try {
      // Create donation record using API
      const response = await apiService.createDonation(donationData);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create donation record');
      }

      const donation = response.data as Donation;
      const certificateId = uuidv4();

      // Create certificate record
      const certificateResponse = await apiService.createCertificate({
        certificateId,
        donationId: donation.id,
        issuedAt: new Date().toISOString(),
        status: 'issued'
      });

      if (!certificateResponse.success) {
        throw new Error(certificateResponse.error?.message || 'Failed to create certificate');
      }

      return {
        donationId: donation.id,
        certificateId
      };
    } catch (error) {
      console.error('Error creating donation record:', error);
      throw error;
    }
  }

  static async generateCertificateData(donationId: string): Promise<CertificateData> {
    try {
      // Get donation details from API
      const response = await apiService.getDonationById(donationId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch donation details');
      }

      const donation = response.data as Donation;
      
      // Get donor details
      const donorResponse = await apiService.getDonorById(donation.donorId);
      if (!donorResponse.success) {
        throw new Error('Failed to fetch donor details');
      }
      const donor = donorResponse.data as Donor;

      const certificateId = uuidv4();
      const verificationUrl = `${this.DOMAIN}/verify/${certificateId}`;
      
      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const certificateData: CertificateData = {
        certificateId,
        donorName: donor.fullName || 'Unknown Donor',
        donorAge: this.calculateAge(donor.dateOfBirth),
        donorGender: donor.gender || 'Not specified',
        donorPhone: donor.phone || 'Not provided',
        donorEmail: donor.email || 'Not provided',
        donorAddress: donor.address ? `${donor.address.street}, ${donor.address.city}, ${donor.address.state} ${donor.address.zipCode}` : 'Not provided',
        donationDate: donation.donationDate,
        bloodType: donation.bloodType,
        donationCenterName: donation.donationCenter?.name || 'Blood Donation Center',
        donationCenterAddress: donation.donationCenter?.address || 'Not provided',
        bloodUnitId: donation.bloodUnitId,
        verificationUrl,
        qrCodeData,
        signatoryName: 'Dr. Medical Officer',
        signatoryDesignation: 'Chief Medical Officer',
        signatureImageUrl: undefined
      };

      // Save certificate data
      await apiService.updateCertificate(certificateId, {
        certificateId,
        donationId,
        donorName: certificateData.donorName,
        donationDate: certificateData.donationDate,
        bloodType: certificateData.bloodType,
        verificationUrl: certificateData.verificationUrl,
        qrCodeData: certificateData.qrCodeData,
        status: 'issued',
        issuedAt: new Date().toISOString()
      });

      return certificateData;
    } catch (error) {
      console.error('Error generating certificate data:', error);
      throw error;
    }
  }

  static async verifyCertificate(certificateId: string): Promise<{ valid: boolean; certificate?: CertificateData; error?: string }> {
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
          error: 'Certificate is not valid'
        };
      }

      // Get associated donation details
      const donationResponse = await apiService.getDonationById(certificate.donationId);
      if (!donationResponse.success) {
        return {
          valid: false,
          error: 'Associated donation record not found'
        };
      }

      const donation = donationResponse.data as Donation;
      const donorResponse = await apiService.getDonorById(donation.donorId);
      
      if (!donorResponse.success) {
        return {
          valid: false,
          error: 'Donor information not found'
        };
      }

      const donor = donorResponse.data as Donor;

      const certificateData: CertificateData = {
        certificateId: certificate.certificateId,
        donorName: donor.fullName,
        donorAge: this.calculateAge(donor.dateOfBirth),
        donorGender: donor.gender,
        donorPhone: donor.phone,
        donorEmail: donor.email,
        donorAddress: donor.address ? `${donor.address.street}, ${donor.address.city}, ${donor.address.state} ${donor.address.zipCode}` : 'Not provided',
        donationDate: donation.donationDate,
        bloodType: donation.bloodType,
        donationCenterName: donation.donationCenter?.name || 'Blood Donation Center',
        donationCenterAddress: donation.donationCenter?.address || 'Not provided',
        bloodUnitId: donation.bloodUnitId,
        verificationUrl: certificate.verificationUrl,
        qrCodeData: certificate.qrCodeData,
        signatoryName: 'Dr. Medical Officer',
        signatoryDesignation: 'Chief Medical Officer'
      };

      return {
        valid: true,
        certificate: certificateData
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return {
        valid: false,
        error: 'Verification failed'
      };
    }
  }

  static async revokeCertificate(certificateId: string, reason: string): Promise<void> {
    try {
      await apiService.updateCertificate(certificateId, {
        status: 'revoked',
        revokedAt: new Date().toISOString(),
        revocationReason: reason
      });
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    }
  }

  static async getUserCertificates(donorId: string): Promise<CertificateData[]> {
    try {
      const response = await apiService.getDonorCertificates(donorId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch certificates');
      }

      return (response.data as CertificateData[]) || [];
    } catch (error) {
      console.error('Error fetching user certificates:', error);
      throw error;
    }
  }

  private static calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  }
}

export default CertificateService;
