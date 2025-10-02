import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export function Navbar() {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.getHealth();
        setHealthStatus('healthy');
      } catch {
        setHealthStatus('unhealthy');
      }
    };
    checkHealth();
  }, []);

  const navItems = [
    { path: '/', label: 'Submit Question' },
    { path: '/open', label: 'Open Questions' },
    { path: '/answered', label: 'Answered Questions' },
    { path: '/admin', label: 'Admin' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">API Status:</div>
            <div
              data-testid="health-status"
              className={`w-3 h-3 rounded-full ${
                healthStatus === 'healthy'
                  ? 'bg-green-500'
                  : healthStatus === 'unhealthy'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
              title={
                healthStatus === 'healthy'
                  ? 'API is healthy'
                  : healthStatus === 'unhealthy'
                  ? 'API is unhealthy'
                  : 'Checking API status...'
              }
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

