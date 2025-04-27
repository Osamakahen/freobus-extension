import { describe, it, expect } from 'vitest'
import { ethers } from "ethers"

describe("Network Connectivity Tests", () => {
  const INFURA_KEY = "6131105f1e4c4841a297c5392effa977"
  
  it("should connect to Ethereum mainnet", async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${INFURA_KEY}`
    )
    const network = await provider.getNetwork()
    expect(network.chainId).toBe(1)
  })

  it("should connect to Polygon mainnet", async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`
    )
    const network = await provider.getNetwork()
    expect(network.chainId).toBe(137)
  })

  it("should get latest block number", async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${INFURA_KEY}`
    )
    const blockNumber = await provider.getBlockNumber()
    expect(blockNumber).toBeGreaterThan(0)
  })
}) 