# Session Management Features

## Overview
The FreoBus Extension implements advanced session management features to ensure secure and reliable connections between the wallet and dApps. This document covers the key components and their functionality.

## 1. Enhanced Auto-Connect Manager

The `EnhancedAutoConnectManager` provides intelligent connection retry logic with progressive backoff and jitter.

### Features
- Progressive backoff with configurable parameters
- Jitter to prevent thundering herd problems
- Event-based status updates
- Connection state tracking

### Usage
```typescript
const autoConnect = new EnhancedAutoConnectManager();

// Retry connection with exponential backoff
await autoConnect.retryConnection('origin', async () => {
  // Your connection logic here
});

// Get connection status
const status = autoConnect.getConnectionStatus('origin');

// Reset connection state
autoConnect.resetConnection('origin');
```

### Configuration
- `maxAttempts`: Maximum number of retry attempts (default: 5)
- `maxDelay`: Maximum delay between retries in milliseconds (default: 30000)
- `baseDelay`: Initial delay in milliseconds (default: 1000)

## 2. Tab Coordination System

The `TabCoordinator` manages communication between multiple browser tabs using the BroadcastChannel API.

### Features
- Leader election system
- Heartbeat mechanism
- State synchronization
- Event-based communication

### Usage
```typescript
const coordinator = new TabCoordinator();

// Request tab lock
const isLeader = await coordinator.requestLock();

// Broadcast state updates
coordinator.broadcast('state-update', { /* state data */ });

// Get current tab state
const state = coordinator.getState();
```

### Events
- `leadershipChanged`: Emitted when tab leadership changes
- `stateUpdate`: Emitted when state is updated
- `sessionUpdate`: Emitted when session data changes

## 3. Session Health Monitoring

The `SessionHealthIndicator` component provides real-time health metrics visualization.

### Features
- Real-time health status
- Performance metrics display
- Error rate monitoring
- Visual status indicators

### Usage
```typescript
<SessionHealthIndicator
  origin="dapp.example.com"
  sessionManager={sessionManager}
/>
```

### Health Status Levels
- **Healthy**: Error rate < 10% and latency < 500ms
- **Degraded**: Error rate 10-50% or latency 500-1000ms
- **Unhealthy**: Error rate > 50% or latency > 1000ms

## 4. Analytics Dashboard

The `SessionAnalyticsDashboard` provides detailed session performance metrics.

### Features
- Session performance tracking
- Error rate analysis
- Latency monitoring
- Connection status visualization

### Usage
```typescript
<SessionAnalyticsDashboard
  sessionManager={sessionManager}
/>
```

### Metrics Tracked
- Total requests
- Successful requests
- Failed requests
- Average latency
- Error rate
- Last update timestamp

## 5. Security Manager

The `SessionSecurityManager` handles session authentication and security.

### Features
- EIP-4361 compliant authentication
- Session metrics tracking
- Health monitoring
- Analytics collection

### Usage
```typescript
const securityManager = new SessionSecurityManager();

// Subscribe to health updates
const unsubscribe = securityManager.subscribeToHealth('origin', (metrics) => {
  // Handle health metrics
});

// Update metrics
securityManager.updateMetrics('origin', success, latency);

// Get session metrics
const metrics = securityManager.getMetrics('origin');
```

## Best Practices

1. **Connection Management**
   - Use the auto-connect manager for all connection attempts
   - Implement proper error handling
   - Monitor connection health

2. **Tab Coordination**
   - Always request lock before critical operations
   - Handle leadership changes gracefully
   - Clean up resources when done

3. **Health Monitoring**
   - Monitor key metrics regularly
   - Set appropriate thresholds
   - Implement fallback strategies

4. **Security**
   - Validate all session data
   - Implement proper authentication
   - Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check network connectivity
   - Verify retry configuration
   - Monitor error rates

2. **Tab Coordination Issues**
   - Verify BroadcastChannel support
   - Check for conflicting locks
   - Monitor heartbeat status

3. **Performance Issues**
   - Monitor latency metrics
   - Check resource usage
   - Review error rates

### Debugging Tools

1. **Analytics Dashboard**
   - View detailed metrics
   - Monitor session health
   - Track performance trends

2. **Health Indicators**
   - Check real-time status
   - Monitor error rates
   - View latency metrics

## API Reference

### EnhancedAutoConnectManager
```typescript
class EnhancedAutoConnectManager {
  retryConnection(origin: string, connectFn: () => Promise<any>): Promise<any>
  getConnectionStatus(origin: string): ConnectionStatus | null
  resetConnection(origin: string): void
}
```

### TabCoordinator
```typescript
class TabCoordinator {
  requestLock(): Promise<boolean>
  broadcast(type: string, data: any): void
  getState(): TabState
  cleanup(): void
}
```

### SessionHealthIndicator
```typescript
interface SessionHealthIndicatorProps {
  origin: string
  sessionManager: SessionManager
}
```

### SessionAnalyticsDashboard
```typescript
interface SessionAnalyticsDashboardProps {
  sessionManager: SessionManager
}
```

### SessionSecurityManager
```typescript
class SessionSecurityManager {
  subscribeToHealth(origin: string, callback: (metrics: HealthMetrics) => void): () => void
  subscribeToAnalytics(callback: (origin: string, metrics: SessionMetrics) => void): () => void
  updateMetrics(origin: string, success: boolean, latency: number): void
  getMetrics(origin: string): SessionMetrics | undefined
  getAllMetrics(): Record<string, SessionMetrics>
} 