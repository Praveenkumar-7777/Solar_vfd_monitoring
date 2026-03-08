import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { vfdAPI } from '../services/api';
import Navbar from '../components/Navbar';
import VfdCard from '../components/VfdCard';
import Charts from '../components/Charts';

const DeviceData = () => {
  const { deviceId } = useParams();
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const fetchDeviceData = async () => {
    try {
      const historyResponse = await vfdAPI.getDeviceHistory(deviceId, 50);
      const history = historyResponse.data.data || [];

      setHistoricalData(history);
      setLatestData(history.length > 0 ? history[0] : null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch device data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Loading device data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Device Data Page</h1>
        <p className="text-gray-600 mb-6">Viewing device: {deviceId}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {latestData ? (
          <>
            <VfdCard data={latestData} />
            <div className="mt-8">
              <Charts data={historicalData} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            No data available for this device.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceData;
