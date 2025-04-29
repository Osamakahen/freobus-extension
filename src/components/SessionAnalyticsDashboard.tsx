import React, { useEffect, useState } from 'react';
import { SessionSecurityManager } from '../security/SessionSecurityManager';

interface SessionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  errorRate: number;
  lastUpdated: number;
}

interface SessionAnalyticsDashboardProps {
  sessionManager: SessionSecurityManager;
}

export const SessionAnalyticsDashboard: React.FC<SessionAnalyticsDashboardProps> = ({
  sessionManager
}) => {
  const [metrics, setMetrics] = useState<Record<string, SessionMetrics>>({});
  const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

  useEffect(() => {
    const updateMetrics = (origin: string, newMetrics: SessionMetrics) => {
      setMetrics(prev => ({
        ...prev,
        [origin]: newMetrics
      }));
    };

    const unsubscribe = sessionManager.subscribeToAnalytics(updateMetrics);
    return () => unsubscribe();
  }, [sessionManager]);

  const getErrorRateColor = (errorRate: number) => {
    if (errorRate > 0.5) return 'text-red-500';
    if (errorRate > 0.1) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getLatencyColor = (latency: number) => {
    if (latency > 1000) return 'text-red-500';
    if (latency > 500) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="session-analytics p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Session Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sessions-list">
          <h3 className="text-lg font-semibold mb-2">Active Sessions</h3>
          <div className="space-y-2">
            {Object.entries(metrics).map(([origin, data]) => (
              <div
                key={origin}
                className={`p-2 rounded cursor-pointer ${
                  selectedOrigin === origin ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedOrigin(origin)}
              >
                <div className="font-medium">{origin}</div>
                <div className="text-sm text-gray-600">
                  Requests: {data.totalRequests} | 
                  Success: {data.successfulRequests} | 
                  Failed: {data.failedRequests}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedOrigin && metrics[selectedOrigin] && (
          <div className="session-details">
            <h3 className="text-lg font-semibold mb-2">Session Details</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Origin:</span> {selectedOrigin}
              </div>
              <div>
                <span className="font-medium">Total Requests:</span>{' '}
                {metrics[selectedOrigin].totalRequests}
              </div>
              <div>
                <span className="font-medium">Success Rate:</span>{' '}
                <span className={getErrorRateColor(metrics[selectedOrigin].errorRate)}>
                  {((1 - metrics[selectedOrigin].errorRate) * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="font-medium">Average Latency:</span>{' '}
                <span className={getLatencyColor(metrics[selectedOrigin].averageLatency)}>
                  {metrics[selectedOrigin].averageLatency}ms
                </span>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(metrics[selectedOrigin].lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 