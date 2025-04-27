import { ethers } from "ethers"

describe("Network Connectivity Tests", () => {
  const INFURA_KEY = "6131105f1e4c4841a297c5392effa977"
  
  test("should connect to Ethereum Mainnet", async () => {
    const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`)
    const network = await provider.getNetwork()
    expect(network.chainId).toBe(1n)
  })

  test("should connect to Sepolia Testnet", async () => {
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_KEY}`)
    const network = await provider.getNetwork()
    expect(network.chainId).toBe(11155111n) // Sepolia chain ID
  })

  test("should get block number from networks", async () => {
    const mainnetProvider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_KEY}`)
    const sepoliaProvider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_KEY}`)
    
    const mainnetBlock = await mainnetProvider.getBlockNumber()
    const sepoliaBlock = await sepoliaProvider.getBlockNumber()
    
    expect(mainnetBlock).toBeGreaterThan(0)
    expect(sepoliaBlock).toBeGreaterThan(0)
  })
}) 