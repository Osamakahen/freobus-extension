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
      setLoading(true);
      
      const response = await sendMessage('grantPermission', {
        methods: ['web3'],
        expiresIn: 24 * 60 * 60 * 1000 // 24 hours
      });

      if (response.success) {
        updateConnectionStatus(true);
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          await updateAccountInfo(accounts[0]);
        }
      } else {
        throw new Error(response.error || 'Failed to connect');
      }
    } catch (error) {
      console.error('Failed to connect:', error);
      statusElement.textContent = error.message || 'Connection failed';
      statusElement.className = 'status disconnected';
      updateConnectionStatus(false);
    } finally {
      setLoading(false);
    }
  });

  // Disconnect button handler
  disconnectButton.addEventListener('click', async () => {
    try {
      disconnectButton.disabled = true;
      const response = await sendMessage('revokePermission', {});
      if (response.success) {
        updateConnectionStatus(false);
        accountInfo.style.display = 'none';
      } else {
        throw new Error(response.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      statusElement.textContent = error.message || 'Disconnect failed';
    } finally {
      disconnectButton.disabled = !isConnected;
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

  // Set loading state
  function setLoading(loading) {
    if (loading) {
      connectButton.classList.add('loading');
      connectButton.disabled = true;
      const loadingText = connectButton.getAttribute('data-loading-text');
      connectButton.dataset.originalText = connectButton.textContent;
      connectButton.textContent = loadingText;
    } else {
      connectButton.classList.remove('loading');
      connectButton.disabled = isConnected;
      if (connectButton.dataset.originalText) {
        connectButton.textContent = connectButton.dataset.originalText;
        delete connectButton.dataset.originalText;
      }
    }
  }

  // Update account information
  async function updateAccountInfo(address) {
    try {
      addressElement.textContent = `Address: ${formatAddress(address)}`;
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      balanceElement.textContent = `Balance: ${formatBalance(balance)} ETH`;
      accountInfo.style.display = 'block';
    } catch (error) {
      console.error('Failed to update account info:', error);
      throw new Error('Failed to fetch account details');
    }
  }

  // Format address for display
  function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Format balance for display
  function formatBalance(balance) {
    return ethers.utils.formatEther(balance).slice(0, 8);
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