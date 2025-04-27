import { ethers } from "ethers";

const INFURA_KEY = "6131105f1e4c4841a297c5392effa977";
const endpoints = {
  mainnet: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  sepolia: `https://sepolia.infura.io/v3/${INFURA_KEY}`
};

async function testNetworks() {
  try {
    for (const [network, endpoint] of Object.entries(endpoints)) {
      console.log(`\nTesting ${network} connection...`);
      const provider = new ethers.JsonRpcProvider(endpoint);
      const networkInfo = await provider.getNetwork();
      console.log(`✓ Successfully connected to ${network}`);
      console.log(`  Chain ID: ${networkInfo.chainId}`);
      
      const blockNumber = await provider.getBlockNumber();
      console.log(`  Current block: ${blockNumber}`);
    }
  } catch (error) {
    console.error("Error testing networks:", error);
    process.exit(1);
  }
}

console.log('Starting network tests...');
testNetworks(); 