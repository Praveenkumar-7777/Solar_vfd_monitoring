import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts = ({ data }) => {
  // Reverse data to show oldest to newest
  const sortedData = [...data].reverse();

  // Prepare labels (timestamps)
  const labels = sortedData.map(item => {
    const date = new Date(item.timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  });

  // Chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  // Run Frequency Chart Data
  const frequencyData = {
    labels,
    datasets: [
      {
        label: 'Run Frequency (Hz)',
        data: sortedData.map(item => item.runFrequency),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  // DC Bus Voltage Chart Data
  const voltageData = {
    labels,
    datasets: [
      {
        label: 'DC Bus Voltage (V)',
        data: sortedData.map(item => item.dcBusVoltage),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  // Output Current Chart Data
  const currentData = {
    labels,
    datasets: [
      {
        label: 'Output Current (A)',
        data: sortedData.map(item => item.outputCurrent),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Historical Data</h2>

      {/* Run Frequency Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Run Frequency vs Time</h3>
        <div style={{ height: '300px' }}>
          <Line data={frequencyData} options={{
            ...commonOptions,
            plugins: {
              ...commonOptions.plugins,
              title: {
                display: false
              }
            }
          }} />
        </div>
      </div>

      {/* DC Bus Voltage Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">DC Bus Voltage vs Time</h3>
        <div style={{ height: '300px' }}>
          <Line data={voltageData} options={{
            ...commonOptions,
            plugins: {
              ...commonOptions.plugins,
              title: {
                display: false
              }
            }
          }} />
        </div>
      </div>

      {/* Output Current Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Output Current vs Time</h3>
        <div style={{ height: '300px' }}>
          <Line data={currentData} options={{
            ...commonOptions,
            plugins: {
              ...commonOptions.plugins,
              title: {
                display: false
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
