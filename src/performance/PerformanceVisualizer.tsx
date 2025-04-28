import * as React from 'react'
import { useEffect, useState } from 'react'
import { performanceService } from '../shared/services/performanceService'

export const PerformanceVisualizer: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({})
  const [resourceUsage, setResourceUsage] = useState<any>({})

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceService.getMetrics()
      const currentResourceUsage = performanceService.getResourceUsage()
      
      setMetrics(currentMetrics)
      setResourceUsage(currentResourceUsage)
    }

    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="performance-visualizer">
      <h3>Performance Metrics</h3>
      <div className="metrics">
        <p>CPU Usage: {metrics.cpuUsage}%</p>
        <p>Memory Usage: {metrics.memoryUsage}MB</p>
        <p>Network Latency: {metrics.networkLatency}ms</p>
      </div>
      <div className="resource-usage">
        <p>Active Connections: {resourceUsage.activeConnections}</p>
        <p>Cache Size: {resourceUsage.cacheSize}MB</p>
      </div>
    </div>
  )
} 