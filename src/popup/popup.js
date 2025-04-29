document.addEventListener('DOMContentLoaded', () => {
  const statusElement = document.getElementById('status');
  const connectButton = document.getElementById('connect');
  const disconnectButton = document.getElementById('disconnect');
  const accountInfo = document.getElementById('accountInfo');
  const addressElement = document.getElementById('address');
  const balanceElement = document.getElementById('balance');

  let isConnected = false;

  // Check initial connection status
  chrome.runtime.sendMessage({ type: 'checkPermission', data: { method: 'web3' } }, (response) => {
    if (response.success && response.hasPermission) {
      updateConnectionStatus(true);
    }
  });

  // Connect button handler
  connectButton.addEventListener('click', async () => {
    try {
      const response = await sendMessage('grantPermission', {
        methods: ['web3'],
        expiresIn: 24 * 60 * 60 * 1000 // 24 hours
      });

      if (response.success) {
        updateConnectionStatus(true);
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          updateAccountInfo(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      statusElement.textContent = 'Connection failed';
      statusElement.className = 'status disconnected';
    }
  });

  // Disconnect button handler
  disconnectButton.addEventListener('click', async () => {
    try {
      const response = await sendMessage('revokePermission', {});
      if (response.success) {
        updateConnectionStatus(false);
        accountInfo.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  });

  // Update connection status UI
  function updateConnectionStatus(connected) {
    isConnected = connected;
    statusElement.textContent = connected ? 'Connected' : 'Not Connected';
    statusElement.className = `status ${connected ? 'connected' : 'disconnected'}`;
    connectButton.disabled = connected;
    disconnectButton.disabled = !connected;
  }

  // Update account information
  async function updateAccountInfo(address) {
    addressElement.textContent = `Address: ${address}`;
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    balanceElement.textContent = `Balance: ${ethers.utils.formatEther(balance)} ETH`;
    accountInfo.style.display = 'block';
  }

  // Helper function to send messages to background script
  function sendMessage(type, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type, data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
  }
}); 