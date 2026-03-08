import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vfdAPI, authAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Charts from '../components/Charts';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [allDevicesData, setAllDevicesData] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredDevicesData, setFilteredDevicesData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [motorStatuses, setMotorStatuses] = useState({});
  const [motorLoading, setMotorLoading] = useState({});

  useEffect(() => {
    fetchData();
    fetchAllMotorStatus();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const filtered = allDevicesData.filter(device => device.deviceId === selectedUser.deviceId);
      setFilteredDevicesData(filtered);
      fetchHistory(selectedUser.deviceId);
    } else {
      setFilteredDevicesData(allDevicesData);
      setHistoryData([]);
    }
    setSelectedIds([]);
  }, [selectedUser, allDevicesData]);

  const fetchData = async () => {
    try {
      const [statsRes, devicesRes, usersRes] = await Promise.all([
        vfdAPI.getStatistics(),
        vfdAPI.getAllVfdData(),
        authAPI.getUsers()
      ]);

      setStatistics(statsRes.data.statistics);
      setAllDevicesData(devicesRes.data.data);
      setUsers(usersRes.data.users);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (deviceId) => {
    try {
      const res = await vfdAPI.getDeviceHistory(deviceId, 500);
      setHistoryData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setHistoryData([]);
    }
  };

  const fetchAllMotorStatus = async () => {
    try {
      const res = await vfdAPI.getAllMotorStatus();
      const statusMap = {};
      res.data.data.forEach(s => { statusMap[s.deviceId] = s.motorState; });
      setMotorStatuses(statusMap);
    } catch (err) {
      console.error('Failed to fetch motor statuses:', err);
    }
  };

  const handleMotorControl = async (deviceId, command) => {
    setMotorLoading(prev => ({ ...prev, [deviceId]: true }));
    try {
      await vfdAPI.sendMotorCommand(deviceId, command);
      setMotorStatuses(prev => ({ ...prev, [deviceId]: command }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send motor command');
    } finally {
      setMotorLoading(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === historyData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(historyData.map(d => d._id));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} reading(s)?`)) return;

    setDeleting(true);
    setDeleteMsg('');
    try {
      const res = await vfdAPI.deleteVfdData(selectedIds);
      setDeleteMsg(res.data.message);
      setSelectedIds([]);
      await fetchData();
      if (selectedUser) {
        await fetchHistory(selectedUser.deviceId);
      }
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || 'Failed to delete readings');
    } finally {
      setDeleting(false);
      setTimeout(() => setDeleteMsg(''), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'STOPPED':
        return 'bg-gray-100 text-gray-800';
      case 'FAULT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Erostar Star Enterprises - Solar VFD Monitoring</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/create-user"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </Link>
            <Link
              to="/create-admin"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Admin
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Devices</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalDevices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Data Points</p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalDataPoints}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filter by User</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedUser(null)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                !selectedUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Users
            </button>
            {users.filter(user => user.role === 'user' && user.deviceId).map((user, index) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedUser?._id === user._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                User {index + 1}: {user.name} ({user.deviceId})
              </button>
            ))}
          </div>
          {selectedUser && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-blue-800">
                <strong>Viewing data for:</strong> {selectedUser.name} | Device: {selectedUser.deviceId}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">
                  Motor: {motorStatuses[selectedUser.deviceId] === 'MOTOR_ON' ? <span className="text-green-600">ON</span> : <span className="text-red-600">OFF</span>}
                </span>
                {motorStatuses[selectedUser.deviceId] === 'MOTOR_ON' ? (
                  <button
                    onClick={() => handleMotorControl(selectedUser.deviceId, 'MOTOR_OFF')}
                    disabled={motorLoading[selectedUser.deviceId]}
                    className={`px-4 py-2 rounded-lg text-white font-semibold text-sm flex items-center gap-2 transition-colors ${
                      motorLoading[selectedUser.deviceId] ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {motorLoading[selectedUser.deviceId] ? 'Sending...' : 'Stop Motor'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleMotorControl(selectedUser.deviceId, 'MOTOR_ON')}
                    disabled={motorLoading[selectedUser.deviceId]}
                    className={`px-4 py-2 rounded-lg text-white font-semibold text-sm flex items-center gap-2 transition-colors ${
                      motorLoading[selectedUser.deviceId] ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {motorLoading[selectedUser.deviceId] ? 'Sending...' : 'Start Motor'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* All Devices Data Table (latest readings) */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedUser ? `${selectedUser.name}'s Device - Latest Reading` : 'All Devices - Latest Readings'}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fault</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Communication</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevicesData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      {selectedUser ? `No device data available for ${selectedUser.name}` : 'No device data available'}
                    </td>
                  </tr>
                ) : (
                  filteredDevicesData.map((device) => (
                    <tr key={device._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        <Link className="text-blue-700 hover:underline" to={`/devices/${device.deviceId}`}>
                          {device.deviceId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(device.status)}`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {device.runFrequency.toFixed(2)} Hz
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {device.dcBusVoltage.toFixed(1)} V
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {device.outputCurrent.toFixed(1)} A
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {device.fault}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs ${device.communicationStatus.includes('OK') ? 'text-green-600' : 'text-red-600'}`}>
                          {device.communicationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(device.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {motorStatuses[device.deviceId] === 'MOTOR_ON' ? (
                          <button
                            onClick={() => handleMotorControl(device.deviceId, 'MOTOR_OFF')}
                            disabled={motorLoading[device.deviceId]}
                            className={`px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors ${
                              motorLoading[device.deviceId] ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
                            }`}
                          >
                            {motorLoading[device.deviceId] ? '...' : 'Stop'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMotorControl(device.deviceId, 'MOTOR_ON')}
                            disabled={motorLoading[device.deviceId]}
                            className={`px-3 py-1 rounded-full text-xs font-semibold text-white transition-colors ${
                              motorLoading[device.deviceId] ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            {motorLoading[device.deviceId] ? '...' : 'Start'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts & Full History - shown when a user/device is selected */}
        {selectedUser && historyData.length > 0 && (
          <>
            {/* Charts */}
            <div className="mt-8">
              <Charts data={historyData} />
            </div>

            {/* Full History Table with Delete */}
            <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedUser.name}'s Full History ({historyData.length} records)
                </h2>
                <div className="flex items-center gap-3">
                  {deleteMsg && (
                    <span className="text-sm text-green-600 font-medium">{deleteMsg}</span>
                  )}
                  {selectedIds.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedIds.length} selected
                    </span>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0 || deleting}
                    className={`px-4 py-2 rounded-lg text-white font-semibold text-sm transition-colors flex items-center gap-2 ${
                      selectedIds.length === 0 || deleting
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === historyData.length && historyData.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voltage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fault</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Communication</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyData.map((reading, index) => (
                      <tr
                        key={reading._id}
                        className={`hover:bg-gray-50 ${selectedIds.includes(reading._id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(reading._id)}
                            onChange={() => toggleSelect(reading._id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{reading.deviceId}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(reading.status)}`}>
                            {reading.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {reading.runFrequency.toFixed(2)} Hz
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {reading.dcBusVoltage.toFixed(1)} V
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                          {reading.outputCurrent.toFixed(1)} A
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm">
                          {reading.fault}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs ${reading.communicationStatus.includes('OK') ? 'text-green-600' : 'text-red-600'}`}>
                            {reading.communicationStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatTimestamp(reading.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Registered Users</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {user.deviceId || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
