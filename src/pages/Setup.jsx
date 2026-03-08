import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Setup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  const [admin, setAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [firstUser, setFirstUser] = useState({
    name: '',
    email: '',
    password: '',
    deviceId: ''
  });

  const [createFirstUser, setCreateFirstUser] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await authAPI.getSetupStatus();
      if (response.data.isSetupComplete) {
        navigate('/');
        return;
      }
    } catch (err) {
      setError('Failed to check setup status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        admin,
        user: createFirstUser ? firstUser : undefined
      };

      const response = await authAPI.setupSystem(payload);
      setSuccess(response.data.message);

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Checking setup status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">First-Time Setup</h1>
          <p className="text-blue-200 mt-2">Create your own admin account and optional first user</p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Admin Name"
                  value={admin.name}
                  onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Admin Email"
                  value={admin.email}
                  onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
                <div className="md:col-span-2 relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="Admin Password"
                    value={admin.password}
                    onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showAdminPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">First User (Optional)</h2>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFirstUser}
                    onChange={(e) => setCreateFirstUser(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Create first user now</span>
                </label>
              </div>

              {createFirstUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="User Name"
                    value={firstUser.name}
                    onChange={(e) => setFirstUser({ ...firstUser, name: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg"
                    required={createFirstUser}
                  />
                  <input
                    type="email"
                    placeholder="User Email"
                    value={firstUser.email}
                    onChange={(e) => setFirstUser({ ...firstUser, email: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg"
                    required={createFirstUser}
                  />
                  <div className="relative">
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      placeholder="User Password"
                      value={firstUser.password}
                      onChange={(e) => setFirstUser({ ...firstUser, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      minLength={6}
                      required={createFirstUser}
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showUserPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Device ID (e.g. VFD001)"
                    value={firstUser.deviceId}
                    onChange={(e) => setFirstUser({ ...firstUser, deviceId: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg"
                    required={createFirstUser}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 rounded-lg text-white font-semibold ${
                  submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Creating Accounts...' : 'Complete Setup'}
              </button>

              <Link
                to="/"
                className="px-6 py-3 rounded-lg text-center border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setup;
