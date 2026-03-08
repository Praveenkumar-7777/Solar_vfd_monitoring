import { useState, useEffect } from 'react';
import { vfdAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import VfdCard from '../components/VfdCard';
import Charts from '../components/Charts';

const UserDashboard = () => {
  const [deviceData, setDeviceData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [motorState, setMotorState] = useState(null);
  const [motorLoading, setMotorLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.deviceId) {
      fetchData();
      fetchMotorStatus();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        vfdAPI.getMyDeviceData(),
        vfdAPI.getDeviceHistory(user.deviceId, 500)
      ]);

      setDeviceData(currentRes.data.data);
      setHistoricalData(historyRes.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch device data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMotorStatus = async () => {
    try {
      const res = await vfdAPI.getMotorStatus(user.deviceId);
      setMotorState(res.data.motorState);
    } catch (err) {
      console.error('Failed to fetch motor status:', err);
    }
  };

  const handleMotorControl = async (command) => {
    setMotorLoading(true);
    try {
      await vfdAPI.sendMotorCommand(user.deviceId, command);
      setMotorState(command);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send motor command');
    } finally {
      setMotorLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === historicalData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(historicalData.map(d => d._id));
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
    } catch (err) {
      setDeleteMsg(err.response?.data?.message || 'Failed to delete readings');
    } finally {
      setDeleting(false);
      setTimeout(() => setDeleteMsg(''), 3000);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-100 text-green-800';
      case 'STOPPED': return 'bg-gray-100 text-gray-800';
      case 'FAULT': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
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
            <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome, {user?.name} | Device: {user?.deviceId}
            </p>
          </div>

          {/* Motor Control */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-600">
              Motor: {motorState === 'MOTOR_ON' ? <span className="text-green-600">ON</span> : <span className="text-red-600">OFF</span>}
            </span>
            {motorState === 'MOTOR_ON' ? (
              <button
                onClick={() => handleMotorControl('MOTOR_OFF')}
                disabled={motorLoading}
                className={`px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors ${
                  motorLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                {motorLoading ? 'Sending...' : 'Stop Motor'}
              </button>
            ) : (
              <button
                onClick={() => handleMotorControl('MOTOR_ON')}
                disabled={motorLoading}
                className={`px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors ${
                  motorLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {motorLoading ? 'Sending...' : 'Start Motor'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* VFD Data Card */}
        {deviceData ? (
          <>
            <VfdCard data={deviceData} />
            
            {/* Charts */}
            {historicalData.length > 0 && (
              <div className="mt-8">
                <Charts data={historicalData} />
              </div>
            )}

            {/* History Table */}
            {historicalData.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    Reading History ({historicalData.length} records)
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
                            checked={selectedIds.length === historicalData.length && historicalData.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
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
                      {historicalData.map((reading, index) => (
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
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl text-gray-600">No data available for your device</p>
            <p className="text-gray-500 mt-2">Waiting for ESP32 to send data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
