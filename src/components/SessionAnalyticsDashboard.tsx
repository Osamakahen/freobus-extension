import React, { useEffect, useState } from 'react';
import { SessionHealthDashboard } from '../types';
import { SessionAnalyticsManager } from '../analytics/SessionAnalyticsManager';

interface SessionAnalyticsDashboardProps {
  analyticsManager: SessionAnalyticsManager;
}

export const SessionAnalyticsDashboard: React.FC<SessionAnalyticsDashboardProps> = ({ analyticsManager }) => {
  const [dashboard, setDashboard] = useState<SessionHealthDashboard>(analyticsManager.getDashboard());

  useEffect(() => {
    const handleMetricsUpdate = (newDashboard: SessionHealthDashboard) => {
      setDashboard(newDashboard);
    };

    analyticsManager.on('metricsUpdated', handleMetricsUpdate);
    return () => {
      analyticsManager.off('metricsUpdated', handleMetricsUpdate);
    };
  }, [analyticsManager]);

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatLatency = (ms: number) => `${ms.toFixed(2)}ms`;

  return (
    <div className="session-analytics-dashboard">
      <h2>Session Analytics Dashboard</h2>
      
      <div className="real-time-metrics">
        <h3>Real-time Metrics</h3>
        <div className="metric-grid">
          <div className="metric-card">
            <h4>Connection Success Rate</h4>
            <p>{formatPercentage(dashboard.realTimeMetrics.connectionSuccess)}</p>
          </div>
          <div className="metric-card">
            <h4>Average Latency</h4>
            <p>{formatLatency(dashboard.realTimeMetrics.averageLatency)}</p>
          </div>
          <div className="metric-card">
            <h4>Reconnect Attempts</h4>
            <p>{dashboard.realTimeMetrics.reconnectAttempts}</p>
          </div>
        </div>
      </div>

      <div className="historical-data">
        <h3>Historical Data</h3>
        <div className="data-section">
          <h4>Daily Connection Stats</h4>
          <div className="stats-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Connections</th>
                  <th>Successful</th>
                  <th>Error Rate</th>
                  <th>Avg Latency</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.historicalData.dailyConnectionStats.map((stats, index) => (
                  <tr key={index}>
                    <td>{stats.date}</td>
                    <td>{stats.totalConnections}</td>
                    <td>{stats.successfulConnections}</td>
                    <td>{formatPercentage(stats.errorCount / stats.totalConnections)}</td>
                    <td>{formatLatency(stats.averageLatency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="data-section">
          <h4>Permission Usage</h4>
          <div className="permission-stats">
            <div className="stat-card">
              <h5>Total Requests</h5>
              <p>{dashboard.historicalData.permissionUsage.totalRequests}</p>
            </div>
            <div className="stat-card">
              <h5>Error Count</h5>
              <p>{dashboard.historicalData.permissionUsage.errorCount}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .session-analytics-dashboard {
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .metric-card {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stats-table {
          overflow-x: auto;
          margin: 20px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f5f5f5;
        }

        .permission-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .stat-card {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        h2, h3, h4, h5 {
          color: #333;
          margin: 10px 0;
        }

        p {
          margin: 5px 0;
          font-size: 1.2em;
          color: #666;
        }
      `}</style>
    </div>
  );
}; 