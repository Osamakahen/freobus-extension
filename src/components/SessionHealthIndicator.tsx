import React, { useEffect, useState } from 'react';
import { SessionSecurityManager } from '../security/SessionSecurityManager';

interface HealthMetrics {
  latency: number;
  errorRate: number;
  lastSuccessfulRequest: number;
  connectionStatus: 'healthy' | 'degraded' | 'unhealthy';
}

interface SessionHealthIndicatorProps {
  origin: string;
  sessionManager: SessionSecurityManager;
}

export const SessionHealthIndicator: React.FC<SessionHealthIndicatorProps> = ({
  origin,
  sessionManager
}) => {
  const [status, setStatus] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);

  useEffect(() => {
    const unsubscribe = sessionManager.subscribeToHealth(origin, (healthData: HealthMetrics) => {
      setMetrics(healthData);
      setStatus(determineHealthStatus(healthData));
    });

    return () => unsubscribe();
  }, [origin, sessionManager]);

  const determineHealthStatus = (metrics: HealthMetrics): 'healthy' | 'degraded' | 'unhealthy' => {
    if (metrics.errorRate > 0.5 || metrics.latency > 1000) return 'unhealthy';
    if (metrics.errorRate > 0.1 || metrics.latency > 500) return 'degraded';
    return 'healthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="session-health flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
      
      {metrics && (
        <div className="metrics text-sm">
          <div className="metric">
            <span className="font-semibold">Latency:</span> {metrics.latency}ms
          </div>
          <div className="metric">
            <span className="font-semibold">Error Rate:</span> {(metrics.errorRate * 100).toFixed(1)}%
          </div>
          <div className="metric">
            <span className="font-semibold">Last Success:</span>{' '}
            {new Date(metrics.lastSuccessfulRequest).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}; 