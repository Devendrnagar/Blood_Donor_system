/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Type definitions
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any[];
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Log detailed error information for debugging
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        
        // If validation errors exist, show more details
        if (data.error?.details && Array.isArray(data.error.details)) {
          const validationErrors = data.error.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join('; ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: any) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && (response.data as any)?.token) {
      this.setToken((response.data as any).token);
    }
    
    return response;
  }

  async login(credentials: any) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && (response.data as any)?.token) {
      this.setToken((response.data as any).token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Donor endpoints
  async registerDonor(donorData: any) {
    return this.request('/donors/register', {
      method: 'POST',
      body: JSON.stringify(donorData),
    });
  }

  async getDonors(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/donors?${queryString}`);
  }

  async getDonor(id: string) {
    return this.request(`/donors/${id}`);
  }

  async getNearbyDonors(params: {
    latitude: number;
    longitude: number;
    maxDistance?: number;
    bloodType?: string;
  }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request(`/donors/nearby?${queryString}`);
  }

  async getDonorProfile() {
    return this.request('/donors/profile/me');
  }

  async updateDonor(donorData: any) {
    return this.request('/donors/profile', {
      method: 'PUT',
      body: JSON.stringify(donorData),
    });
  }

  async updateDonorAvailability(isAvailable: boolean) {
    return this.request('/donors/availability', {
      method: 'PUT',
      body: JSON.stringify({ isAvailable }),
    });
  }

  // Blood request endpoints
  async createBloodRequest(requestData: any) {
    return this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getBloodRequests(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/requests?${queryString}`);
  }

  async getBloodRequest(id: string) {
    return this.request(`/requests/${id}`);
  }

  async getNearbyRequests(params: {
    latitude: number;
    longitude: number;
    maxDistance?: number;
    bloodType?: string;
  }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request(`/requests/nearby?${queryString}`);
  }

  async getMyRequests(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/requests/user/my-requests?${queryString}`);
  }

  async updateBloodRequest(id: string, requestData: any) {
    return this.request(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
    });
  }

  async deleteBloodRequest(id: string) {
    return this.request(`/requests/${id}`, {
      method: 'DELETE',
    });
  }

  async respondToRequest(id: string, message: string) {
    return this.request(`/requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getRequestResponses(id: string) {
    return this.request(`/requests/${id}/responses`);
  }

  // Certificate endpoints
  async getMyCertificates(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/certificates/my-certificates?${queryString}`);
  }

  async getCertificate(id: string) {
    return this.request(`/certificates/${id}`);
  }

  async downloadCertificate(id: string) {
    return this.request(`/certificates/${id}/download`);
  }

  async verifyCertificate(verificationCode: string) {
    return this.request(`/certificates/verify/${verificationCode}`);
  }

  async generateCertificate(donationId: string) {
    return this.request(`/donations/${donationId}/generate-certificate`, {
      method: 'POST',
    });
  }

  // Donation endpoints
  async getMyDonations(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/donations/my-donations?${queryString}`);
  }

  async getDonation(id: string) {
    return this.request(`/donations/${id}`);
  }

  // Statistics endpoints
  async getDonorStats() {
    return this.request('/donors/stats');
  }

  async getRequestStats() {
    return this.request('/requests/stats');
  }

  async getDonationStats() {
    return this.request('/donations/stats');
  }

  async getCertificateStats() {
    return this.request('/certificates/stats');
  }

  // Search endpoints
  async searchDonors(params: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/donors/search?${queryString}`);
  }

  async searchRequests(params: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/requests/search?${queryString}`);
  }

  // Certificate specific methods
  async createCertificate(certificateData: any) {
    return this.request('/certificates', {
      method: 'POST',
      body: JSON.stringify(certificateData),
    });
  }

  async getCertificateById(certificateId: string) {
    return this.request(`/certificates/${certificateId}`);
  }

  async updateCertificate(certificateId: string, updateData: any) {
    return this.request(`/certificates/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteCertificate(certificateId: string) {
    return this.request(`/certificates/${certificateId}`, {
      method: 'DELETE',
    });
  }

  async getDonorCertificates(donorId: string) {
    return this.request(`/donors/${donorId}/certificates`);
  }

  // Donation specific methods
  async createDonation(donationData: any) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  async getDonationById(donationId: string) {
    return this.request(`/donations/${donationId}`);
  }

  async getDonorById(donorId: string) {
    return this.request(`/donors/${donorId}`);
  }

  async getCertificates(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/certificates?${queryString}`);
  }

  // Inventory endpoints
  async getDashboardStats(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/dashboard-stats?${queryString}`);
  }

  async getBloodInventory(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory?${queryString}`);
  }

  async createBloodInventory(inventoryData: any) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  }

  async updateBloodInventory(id: string, inventoryData: any) {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData),
    });
  }

  async deleteBloodInventory(id: string) {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  async getInventoryAlerts() {
    return this.request('/inventory/alerts');
  }

  async generateInventoryReport(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/report?${queryString}`);
  }
}

export const apiService = new ApiService();
export default apiService;
