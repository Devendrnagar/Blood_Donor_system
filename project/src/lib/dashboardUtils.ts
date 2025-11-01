// Dashboard utility functions and types

export interface BloodInventoryItem {
  bloodType: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
  locationCount: number;
  lowStockLocations: number;
  expiringSoon: number;
  status: 'Available' | 'Low Stock' | 'Out of Stock';
}

export interface LocationInventory {
  location: {
    name: string;
    city: string;
    type: string;
  };
  bloodTypes: Array<{
    type: string;
    units: number;
    reserved: number;
    status: string;
    expiry: string;
  }>;
  totalUnits: number;
  lastUpdated: string;
  status: string;
}

export interface DashboardStats {
  summary: {
    totalUnitsAvailable: number;
    totalDonors: number;
    totalDonations: number;
    totalLocations: number;
  };
  bloodInventory: BloodInventoryItem[];
  recentDonations: Array<{
    _id: string;
    donationDate: string;
    bloodType: string;
    volumeDonated: number;
    donor: {
      user: {
        fullName: string;
      };
    };
    donationCenter: {
      name: string;
    };
    status: string;
  }>;
  locationInventory: LocationInventory[];
  certificateStats: {
    issued: number;
    pending: number;
    revoked: number;
    total: number;
  };
  lowStockAlerts: Array<{
    location: {
      name: string;
      city: string;
    };
    bloodType: string;
    unitsAvailable: number;
    minimumThreshold: number;
  }>;
}

export interface InventoryAlert {
  lowStock: Array<{
    location: {
      name: string;
      city: string;
    };
    bloodType: string;
    unitsAvailable: number;
    minimumThreshold: number;
    status: string;
  }>;
  expiringSoon: Array<{
    location: {
      name: string;
      city: string;
    };
    bloodType: string;
    unitsAvailable: number;
    expiryDate: string;
  }>;
  expired: Array<{
    location: {
      name: string;
      city: string;
    };
    bloodType: string;
    unitsAvailable: number;
    expiryDate: string;
  }>;
  totalAlerts: number;
}

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Available':
      return 'text-green-600 bg-green-100';
    case 'Low Stock':
      return 'text-yellow-600 bg-yellow-100';
    case 'Out of Stock':
      return 'text-red-600 bg-red-100';
    case 'Expired':
      return 'text-gray-600 bg-gray-100';
    case 'Reserved':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getUnitsColor = (units: number): string => {
  if (units === 0) return 'text-red-600'; // 🔴 0 units
  if (units <= 10) return 'text-yellow-600'; // 🟡 1-10 units
  return 'text-green-600'; // 🟢 >10 units
};

export const getUnitsIcon = (units: number): string => {
  if (units === 0) return '🔴';
  if (units <= 10) return '🟡';
  return '🟢';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const exportToCSV = (data: any[], filename: string) => {
  const headers = Object.keys(data[0]).join(',');
  const csvContent = [
    headers,
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePrintableReport = (data: DashboardStats) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Blood Inventory Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .inventory-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .inventory-table th, .inventory-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .inventory-table th { background-color: #f5f5f5; }
        .status-available { color: green; }
        .status-low { color: orange; }
        .status-out { color: red; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Blood Inventory Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="summary">
        <div class="summary-card">
          <h3>Total Units</h3>
          <p>${data.summary.totalUnitsAvailable}</p>
        </div>
        <div class="summary-card">
          <h3>Total Donors</h3>
          <p>${data.summary.totalDonors}</p>
        </div>
        <div class="summary-card">
          <h3>Total Donations</h3>
          <p>${data.summary.totalDonations}</p>
        </div>
        <div class="summary-card">
          <h3>Total Locations</h3>
          <p>${data.summary.totalLocations}</p>
        </div>
      </div>

      <h2>Blood Inventory by Type</h2>
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Blood Type</th>
            <th>Available Units</th>
            <th>Reserved Units</th>
            <th>Total Units</th>
            <th>Locations</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.bloodInventory.map(item => `
            <tr>
              <td>${item.bloodType}</td>
              <td>${item.availableUnits}</td>
              <td>${item.reservedUnits}</td>
              <td>${item.totalUnits}</td>
              <td>${item.locationCount}</td>
              <td class="status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Low Stock Alerts</h2>
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>Blood Type</th>
            <th>Available Units</th>
            <th>Minimum Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${data.lowStockAlerts.map(alert => `
            <tr>
              <td>${alert.location.name}, ${alert.location.city}</td>
              <td>${alert.bloodType}</td>
              <td>${alert.unitsAvailable}</td>
              <td>${alert.minimumThreshold}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};
