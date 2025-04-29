# Quick Start Guide

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/freobus-extension.git
cd freobus-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

## Basic Usage

### 1. Setting Up Auto-Connect

```typescript
import { EnhancedAutoConnectManager } from '../utils/AutoConnectManager';

const autoConnect = new EnhancedAutoConnectManager();

// Connect to a dApp
try {
  await autoConnect.retryConnection('dapp.example.com', async () => {
    // Your connection logic here
  });
} catch (error) {
  console.error('Connection failed:', error);
}
```

### 2. Managing Multiple Tabs

```typescript
import { TabCoordinator } from '../utils/TabCoordinator';

const coordinator = new TabCoordinator();

// Request tab lock before critical operations
const isLeader = await coordinator.requestLock();
if (isLeader) {
  // Perform critical operation
}

// Clean up when done
coordinator.cleanup();
```

### 3. Monitoring Session Health

```typescript
import { SessionHealthIndicator } from '../components/SessionHealthIndicator';
import { SessionSecurityManager } from '../security/SessionSecurityManager';

const sessionManager = new SessionSecurityManager();

// Add health indicator to your UI
<SessionHealthIndicator
  origin="dapp.example.com"
  sessionManager={sessionManager}
/>
```

### 4. Using the Analytics Dashboard

```typescript
import { SessionAnalyticsDashboard } from '../components/SessionAnalyticsDashboard';

// Add analytics dashboard to your UI
<SessionAnalyticsDashboard
  sessionManager={sessionManager}
/>
```

## Common Patterns

### 1. Connection Retry Pattern

```typescript
async function connectWithRetry(origin: string) {
  const autoConnect = new EnhancedAutoConnectManager();
  
  try {
    return await autoConnect.retryConnection(origin, async () => {
      // Your connection logic here
      return await connectToDapp(origin);
    });
  } catch (error) {
    console.error('Connection failed after retries:', error);
    throw error;
  }
}
```

### 2. Tab Coordination Pattern

```typescript
async function performCriticalOperation() {
  const coordinator = new TabCoordinator();
  
  try {
    const isLeader = await coordinator.requestLock();
    if (!isLeader) {
      throw new Error('Failed to acquire tab lock');
    }
    
    // Perform critical operation
    await doSomethingImportant();
    
  } finally {
    coordinator.cleanup();
  }
}
```

### 3. Health Monitoring Pattern

```typescript
function setupHealthMonitoring(origin: string) {
  const sessionManager = new SessionSecurityManager();
  
  const unsubscribe = sessionManager.subscribeToHealth(origin, (metrics) => {
    if (metrics.connectionStatus === 'unhealthy') {
      // Handle unhealthy state
      handleUnhealthyConnection(origin);
    }
  });
  
  return unsubscribe;
}
```

## Configuration

### Auto-Connect Configuration

```typescript
const autoConnect = new EnhancedAutoConnectManager({
  maxAttempts: 5,
  maxDelay: 30000,
  baseDelay: 1000
});
```

### Tab Coordination Configuration

```typescript
const coordinator = new TabCoordinator({
  leaderTimeout: 5000,
  heartbeatInterval: 1000
});
```

## Best Practices

1. **Error Handling**
   - Always implement proper error handling
   - Use try-catch blocks for critical operations
   - Log errors for debugging

2. **Resource Management**
   - Clean up resources when done
   - Unsubscribe from event listeners
   - Release tab locks

3. **Performance**
   - Monitor connection health
   - Track performance metrics
   - Implement fallback strategies

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

### Debugging

1. **Enable Debug Logging**
```typescript
// Add to your configuration
const config = {
  debug: true,
  logLevel: 'verbose'
};
```

2. **Use Analytics Dashboard**
   - Monitor session health
   - Track performance metrics
   - Identify issues

## Next Steps

1. Review the [API Documentation](./api.md)
2. Check out the [Examples](./examples)
3. Read the [Best Practices Guide](./best-practices.md) 