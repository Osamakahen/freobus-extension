import { Network } from './types/wallet';

export const networks: Network[] = [
  {
    chainId: '1',
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/your-api-key',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    icon: 'icons/ethereum.svg',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: '137',
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    currencySymbol: 'MATIC',
    blockExplorerUrl: 'https://polygonscan.com',
    icon: 'icons/polygon.svg',
    nativeCurrency: {
      name: 'Matic',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  {
    chainId: '56',
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    currencySymbol: 'BNB',
    blockExplorerUrl: 'https://bscscan.com',
    icon: 'icons/bsc.svg',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  },
  {
    chainId: '42161',
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io',
    icon: 'icons/arbitrum.svg',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  {
    chainId: '10',
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    currencySymbol: 'ETH',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    icon: 'icons/optimism.svg',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
];

export const getNetworkByChainId = (chainId: string): Network | undefined => {
  return networks.find(network => network.chainId === chainId);
};

export const getNetworkIcon = (chainId: string): string => {
  const network = getNetworkByChainId(chainId);
  return network?.icon || 'icons/ethereum.svg';
}; 