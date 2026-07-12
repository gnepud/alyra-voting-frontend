import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { hardhat } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [hardhat]

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
