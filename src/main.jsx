import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { SuiClient } from '@mysten/sui/client'
import '@mysten/dapp-kit/dist/index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

// Use Tatum RPC for testnet
const suiClient = new SuiClient({
  url: import.meta.env.VITE_TATUM_API_KEY
    ? `https://sui-testnet.tatum.io`
    : 'https://fullnode.testnet.sui.io:443',
  fetchOptions: import.meta.env.VITE_TATUM_API_KEY
    ? { headers: { 'x-api-key': import.meta.env.VITE_TATUM_API_KEY } }
    : {},
})

function createClient(network) {
  return suiClient;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider createClient={createClient} defaultNetwork="testnet">
        <WalletProvider autoConnect={false}>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
