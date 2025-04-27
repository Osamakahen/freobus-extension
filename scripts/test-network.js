const { ethers } = require("ethers");

async function testNetworks() {
  const INFURA_KEY = "6131105f1e4c4841a297c5392effa977";
  const endpoints = {
    mainnet: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    sepolia: `https://sepolia.infura.io/v3/${INFURA_KEY}`
  };

  // JSON-RPC request to get the latest block number
  const rpcRequest = {
    jsonrpc: "2.0",
    method: "eth_blockNumber",
    params: [],
    id: 1
  };

  for (const [network, endpoint] of Object.entries(endpoints)) {
    try {
      console.log(`\nTesting ${network} connection...`);
      console.log(`Endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpcRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const blockNumber = parseInt(data.result, 16);
      
      console.log('✓ Connection successful');
      console.log(`✓ Latest block number: ${blockNumber}`);
      
      // Test chain ID
      const chainIdResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1
        })
      });

      const chainData = await chainIdResponse.json();
      const chainId = parseInt(chainData.result, 16);
      console.log(`✓ Chain ID: ${chainId}`);

    } catch (error) {
      console.error(`✗ Error testing ${network}:`, error.message);
    }
  }
}

// Run the tests
console.log('Starting Infura endpoint tests...');
testNetworks()
  .then(() => console.log('\nTests completed'))
  .catch(error => console.error('Test suite error:', error)); 