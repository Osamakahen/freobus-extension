import type { PlasmoMessaging } from "@plasmohq/messaging"
import { walletService } from "../shared/services/wallet"
import type { Transaction } from "../shared/types/wallet"

export interface WalletRequest {
  type: "CREATE_WALLET" | "UNLOCK_WALLET" | "ADD_ACCOUNT" | "SIGN_TRANSACTION" | 
        "CONNECT_SITE" | "DISCONNECT_SITE" | "SET_NETWORK" | "GET_SESSION" | 
        "SIGN_MESSAGE" | "SWITCH_CHAIN"
  payload?: any
}

const handleWalletRequest: PlasmoMessaging.MessageHandler = async (req, res) => {
  const request = req.body as WalletRequest

  try {
    switch (request.type) {
      case "CREATE_WALLET":
        await walletService.createWallet(request.payload.password)
        res.send({ success: true })
        break

      case "UNLOCK_WALLET":
        const success = await walletService.unlockWallet(request.payload.password)
        res.send({ success })
        break

      case "ADD_ACCOUNT":
        const account = await walletService.addAccount(request.payload.name)
        res.send({ account })
        break

      case "SIGN_TRANSACTION":
        const signedTx = await walletService.signTransaction(request.payload as Transaction)
        res.send({ signedTx })
        break

      case "CONNECT_SITE":
        await walletService.connectSite(
          request.payload.origin,
          request.payload.accounts,
          request.payload.permissions
        )
        res.send({ success: true })
        break

      case "DISCONNECT_SITE":
        await walletService.disconnectSite(request.payload.origin)
        res.send({ success: true })
        break

      case "SET_NETWORK":
        await walletService.setNetwork(request.payload.chainId)
        res.send({ success: true })
        break

      case "GET_SESSION":
        const session = await walletService.getSession(request.payload.origin)
        res.send({ success: true, session })
        break

      case "SIGN_MESSAGE":
        const signature = await walletService.signMessage(
          request.payload.message,
          request.payload.address
        )
        res.send({ success: true, signature })
        break

      case "SWITCH_CHAIN":
        await walletService.updateNetwork(
          request.payload.origin,
          request.payload.chainId
        )
        res.send({ success: true })
        break

      default:
        throw new Error(`Unknown request type: ${request.type}`)
    }
  } catch (error) {
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

export default handleWalletRequest 