import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL

if (!rpcUrl) {
  throw new Error('NEXT_PUBLIC_RPC_URL is not set')
}

// Override Sepolia network default RPC endpoints with our custom Infura RPC URL
export const customSepolia: AppKitNetwork = {
  ...sepolia,
  rpcUrls: {
    ...sepolia.rpcUrls,
    default: {
      http: [rpcUrl],
    },
    public: {
      http: [rpcUrl],
    },
  },
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [customSepolia]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
})

export const metadata = {
  name: 'Alyra Voting System',
  description: 'Decentralized Voting System dApp',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/179229938']
}

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

if (!CONTRACT_ADDRESS) {
  throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set')
}
