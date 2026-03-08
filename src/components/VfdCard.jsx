const VfdCard = ({ data }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-500';
      case 'STOPPED':
        return 'bg-gray-500';
      case 'FAULT':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getCommunicationColor = (status) => {
    return status.includes('OK') ? 'text-green-600' : 'text-red-600';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
        <h2 className="text-2xl font-bold text-white">Device: {data.deviceId}</h2>
        <p className="text-blue-100 text-sm mt-1">Solar VFD Monitoring</p>
      </div>

      {/* Status Banner */}
      <div className={`${getStatusColor(data.status)} px-6 py-3`}>
        <div className="flex items-center justify-between text-white">
          <span className="text-lg font-semibold">Status: {data.status}</span>
          <span className="text-sm">{formatTimestamp(data.timestamp)}</span>
        </div>
      </div>

      {/* Parameters Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Run Frequency */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="ml-3 text-gray-700 font-semibold">Run Frequency</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              {data.runFrequency.toFixed(2)}
              <span className="text-lg ml-1">Hz</span>
            </p>
          </div>

          {/* DC Bus Voltage */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-5 border border-yellow-200">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="ml-3 text-gray-700 font-semibold">DC Bus Voltage</span>
            </div>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {data.dcBusVoltage.toFixed(1)}
              <span className="text-lg ml-1">V</span>
            </p>
          </div>

          {/* Output Current */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
            <div className="flex items-center mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="ml-3 text-gray-700 font-semibold">Output Current</span>
            </div>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {data.outputCurrent.toFixed(1)}
              <span className="text-lg ml-1">A</span>
            </p>
          </div>
        </div>

        {/* Fault and Communication Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Fault Status */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center mb-2">
              <svg className={`w-6 h-6 ${data.fault.includes('No Fault') ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="ml-3 text-gray-700 font-semibold">Fault Status</span>
            </div>
            <p className={`text-lg font-semibold mt-2 ${data.fault.includes('No Fault') ? 'text-green-600' : 'text-red-600'}`}>
              {data.fault}
            </p>
          </div>

          {/* Communication Status */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center mb-2">
              <svg className={`w-6 h-6 ${getCommunicationColor(data.communicationStatus)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <span className="ml-3 text-gray-700 font-semibold">Communication</span>
            </div>
            <p className={`text-lg font-semibold mt-2 ${getCommunicationColor(data.communicationStatus)}`}>
              {data.communicationStatus}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Last updated: {formatTimestamp(data.timestamp)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Auto-refreshes every 5 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default VfdCard;
