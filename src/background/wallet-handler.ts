import type { PlasmoMessaging } from "@plasmohq/messaging"

const handleWalletRequest: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log('[WalletHandler] Received request:', req);
  res.send({ success: true, message: 'Wallet handler is in test mode' });
}

export default handleWalletRequest