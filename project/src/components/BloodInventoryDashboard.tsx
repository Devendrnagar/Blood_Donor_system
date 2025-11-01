import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../lib/apiService';
import {
  DashboardStats,
  InventoryAlert,
  BLOOD_TYPES,
  getStatusColor,
  getUnitsColor,
  getUnitsIcon,
  formatDate,
  formatDateTime,
  exportToCSV,
  generatePrintableReport
} from '../lib/dashboardUtils';
import {
  Activity,
  Droplet,
  Users,
  Heart,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  MapPin,
  Award,
  Clock,
  Building2,
  Search
} from 'lucide-react';

const BloodInventoryDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filters
  const [bloodTypeFilter, setBloodTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      const [statsResponse, alertsResponse] = await Promise.all([
        apiService.getDashboardStats(params),
        apiService.getInventoryAlerts()
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data as DashboardStats);
      }

      if (alertsResponse.success) {
        setAlerts(alertsResponse.data as InventoryAlert);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  const handleExportCSV = () => {
    if (!stats) return;

    const inventoryData = stats.bloodInventory.map(item => ({
      BloodType: item.bloodType,
      AvailableUnits: item.availableUnits,
      ReservedUnits: item.reservedUnits,
      TotalUnits: item.totalUnits,
      Locations: item.locationCount,
      Status: item.status
    }));

    exportToCSV(inventoryData, `blood_inventory_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePrintReport = () => {
    if (!stats) return;
    generatePrintableReport(stats);
  };

  const filteredInventory = stats?.bloodInventory.filter(item => {
    if (bloodTypeFilter !== 'All' && item.bloodType !== bloodTypeFilter) return false;
    return true;
  }) || [];

  const filteredLocations = stats?.locationInventory.filter(location => {
    if (locationFilter && !location.location.name.toLowerCase().includes(locationFilter.toLowerCase()) &&
        !location.location.city.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
          <span className="text-lg text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blood Inventory Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Real-time overview of blood availability and donation statistics
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                onClick={handlePrintReport}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                <select
                  value={bloodTypeFilter}
                  onChange={(e) => setBloodTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="All">All Blood Types</option>
                  {BLOOD_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-10 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <Droplet className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Blood Units</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.totalUnitsAvailable}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Donors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.totalDonors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Donations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.totalDonations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Locations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.totalLocations}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {alerts && alerts.totalAlerts > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-800">
                Inventory Alerts ({alerts.totalAlerts})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.lowStock.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-red-700 mb-2">Low Stock ({alerts.lowStock.length})</h4>
                  <div className="space-y-2">
                    {alerts.lowStock.slice(0, 3).map((alert, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{alert.bloodType}</span> at{' '}
                        <span className="text-gray-600">{alert.location.name}</span>
                        <br />
                        <span className="text-red-600">{alert.unitsAvailable} units</span>
                      </div>
                    ))}
                    {alerts.lowStock.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{alerts.lowStock.length - 3} more locations
                      </p>
                    )}
                  </div>
                </div>
              )}

              {alerts.expiringSoon.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-orange-700 mb-2">Expiring Soon ({alerts.expiringSoon.length})</h4>
                  <div className="space-y-2">
                    {alerts.expiringSoon.slice(0, 3).map((alert, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{alert.bloodType}</span> at{' '}
                        <span className="text-gray-600">{alert.location.name}</span>
                        <br />
                        <span className="text-orange-600">Expires: {formatDate(alert.expiryDate)}</span>
                      </div>
                    ))}
                    {alerts.expiringSoon.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{alerts.expiringSoon.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {alerts.expired.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-red-700 mb-2">Expired ({alerts.expired.length})</h4>
                  <div className="space-y-2">
                    {alerts.expired.slice(0, 3).map((alert, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{alert.bloodType}</span> at{' '}
                        <span className="text-gray-600">{alert.location.name}</span>
                        <br />
                        <span className="text-red-600">Expired: {formatDate(alert.expiryDate)}</span>
                      </div>
                    ))}
                    {alerts.expired.length > 3 && (
                      <p className="text-sm text-gray-500">
                        +{alerts.expired.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Blood Availability Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-red-600" />
                  Blood Availability by Type
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Locations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item) => (
                      <tr key={item.bloodType} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{getUnitsIcon(item.availableUnits)}</span>
                            <span className="text-sm font-medium text-gray-900">{item.bloodType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-bold ${getUnitsColor(item.availableUnits)}`}>
                            {item.availableUnits} Units
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.reservedUnits} Units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.locationCount} Locations
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Certificate Summary */}
            {stats && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Certificate Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Issued</span>
                    <span className="text-lg font-semibold text-green-600">{stats.certificateStats.issued}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-lg font-semibold text-yellow-600">{stats.certificateStats.pending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revoked</span>
                    <span className="text-lg font-semibold text-red-600">{stats.certificateStats.revoked}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">{stats.certificateStats.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Donations */}
            {stats && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-600" />
                  Recent Donations
                </h3>
                <div className="space-y-4">
                  {stats.recentDonations.slice(0, 5).map((donation) => (
                    <div key={donation._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <Droplet className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {donation.donor.user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {donation.bloodType} • {donation.volumeDonated}ml
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(donation.donationDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location-wise Inventory */}
        {stats && (
          <div className="mt-8 bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Location-wise Stock Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Types
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLocations.map((location, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.location.name}</div>
                          <div className="text-sm text-gray-500">{location.location.city}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {location.location.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${getUnitsColor(location.totalUnits)}`}>
                          {location.totalUnits} Units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {location.bloodTypes.slice(0, 4).map((bloodType, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                            >
                              {bloodType.type}: {bloodType.units}
                            </span>
                          ))}
                          {location.bloodTypes.length > 4 && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              +{location.bloodTypes.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(location.lastUpdated)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(location.status)}`}>
                          {location.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodInventoryDashboard;
