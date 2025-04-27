export type WalletMessage =
  | {
      type: "SWITCH_CHAIN"
      payload: {
        origin: string
        chainId: string
      }
    }
  | {
      type: "CREATE_WALLET"
      payload: {
        password: string
      }
    }
  | {
      type: "UNLOCK_WALLET"
      payload: {
        password: string
      }
    }
  | {
      type: "ADD_ACCOUNT"
      payload: {
        name: string
      }
    }
  | {
      type: "SIGN_TRANSACTION"
      payload: any // Transaction type from ethers/viem
    }
  | {
      type: "CONNECT_SITE"
      payload: {
        origin: string
        accounts: string[]
        permissions: string[]
      }
    }
  | {
      type: "DISCONNECT_SITE"
      payload: {
        origin: string
      }
    }
  | {
      type: "SET_NETWORK"
      payload: {
        chainId: string
      }
    }
  | {
      type: "GET_SESSION"
      payload: {
        origin: string
      }
    }
  | {
      type: "SIGN_MESSAGE"
      payload: {
        message: string
        address: string
      }
    } 