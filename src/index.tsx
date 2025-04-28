import * as React from 'react'
import { createRoot } from 'react-dom/client'

const App: React.FC = () => {
  return (
    <div>
      <h1>FreoBus Wallet</h1>
    </div>
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} 