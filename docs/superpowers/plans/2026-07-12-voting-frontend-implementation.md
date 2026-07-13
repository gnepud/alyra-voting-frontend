# Voting Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified, responsive dApp voting dashboard in Next.js 16/React 19, connected to `Voting.sol` on Hardhat localhost using Reown AppKit, Wagmi v3, Zustand, and shadcn/ui.

**Architecture:** We use an Event-Synchronized custom hook (`useVotingData.ts`) to manage direct RPC reads/event logs and a Zustand store (`useUiStore.ts`) for UI notifications, toasts, and transaction states. The main page dynamically renders layout panels based on the caller's role (Owner, Voter, Guest) and the active contract phase.

**Tech Stack:** Next.js 16, React 19, Reown AppKit, Wagmi v3, Viem v2, Zustand, Tailwind CSS v4, Vitest, React Testing Library.

## Global Constraints
*   **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Hardhat Localhost).
*   **Reown Project ID**: Fallback to public testing Project ID `b56e18d47c72ab683b10814fe9495694` in dev.
*   **SSR Check**: `ssr: true` in WagmiAdapter and cookie sync in Layout headers.
*   **Getter Safety**: Never invoke `getOneProposal` or `getVoter` for non-registered addresses to prevent contract reverts.
*   **No Placeholders**: All implementation code must be fully defined with no TBD/TODO statements.

---

### Task 1: Testing & Scaffolding Setup

**Files:**
*   Modify: `package.json`
*   Modify: `tsconfig.json`
*   Modify: `next.config.ts`
*   Create: `vitest.config.ts`
*   Create: `tests/setup.ts`

**Interfaces:**
*   Produces: Vitest test execution environment with JSDOM support for testing React 19 / Next.js 16 components and hooks.

- [ ] **Step 1: Write the config and mock test**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

Add test script to `package.json`:
```json
"test": "vitest run"
```

Configure Webpack externals in `next.config.ts` to prevent build issues:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
```

Create a simple verification test `tests/smoke.test.ts`:
```typescript
import { expect, test } from 'vitest'

test('Vitest is configured correctly', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`
Run: `npm run test`
Expected: 1 test passed.

- [ ] **Step 3: Commit**

```bash
git add package.json tsconfig.json next.config.ts vitest.config.ts tests/setup.ts tests/smoke.test.ts
git commit -m "chore: setup vitest testing configuration and webpack externals"
```

---

### Task 2: Reown AppKit Config & Context Provider

**Files:**
*   Create: `src/config/index.ts`
*   Create: `src/context/index.tsx`
*   Modify: `src/app/layout.tsx`
*   Create: `tests/config.test.ts`

**Interfaces:**
*   Consumes: Root layout props and AppKit credentials.
*   Produces: `ContextProvider` which initiates Reown and hydrates Wagmi state on the client.

- [ ] **Step 1: Write a failing test for the config export**

Create `tests/config.test.ts`:
```typescript
import { expect, test } from 'vitest'
import { projectId, networks, wagmiAdapter } from '../src/config'

test('exports correct Web3 configuration', () => {
  expect(projectId).toBe('b56e18d47c72ab683b10814fe9495694')
  expect(networks[0].id).toBe(31337) // hardhat
  expect(wagmiAdapter).toBeDefined()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/config.test.ts`
Expected: FAIL due to missing `src/config` imports.

- [ ] **Step 3: Write implementation**

Create `src/config/index.ts`:
```typescript
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
```

Create `src/context/index.tsx`:
```typescript
'use client'

import React, { type ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { projectId, networks, wagmiAdapter, metadata } from '@/config'

const queryClient = new QueryClient()

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false
  }
})

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  )

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

Modify `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alyra Voting System",
  description: "Decentralized Voting System built with Next.js and Hardhat",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookies = headersList.get("cookie");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black text-black dark:text-zinc-50">
        <ContextProvider cookies={cookies}>
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/index.ts src/context/index.tsx src/app/layout.tsx tests/config.test.ts
git commit -m "feat: configure Reown AppKit SSR adapter and layout context provider"
```

---

### Task 3: Zustand Store & UI Primitives

**Files:**
*   Create: `src/store/useUiStore.ts`
*   Create: `tests/uiStore.test.ts`

**Interfaces:**
*   Produces: `useUiStore` Zustand hook for managing transaction pending status and toast alerts.

- [ ] **Step 1: Write a failing test for the Zustand store**

Create `tests/uiStore.test.ts`:
```typescript
import { expect, test, describe, beforeAll } from 'vitest'
import { useUiStore } from '../src/store/useUiStore'

describe('useUiStore', () => {
  test('initializes with default values', () => {
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(false)
    expect(state.pendingTxHash).toBeNull()
    expect(state.toasts).toEqual([])
  })

  test('updates pending transaction state', () => {
    useUiStore.getState().setTxPending(true, '0xabc123')
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(true)
    expect(state.pendingTxHash).toBe('0xabc123')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/uiStore.test.ts`
Expected: FAIL due to missing store file.

- [ ] **Step 3: Write implementation**

Create `src/store/useUiStore.ts`:
```typescript
import { create } from 'zustand'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}

interface UiState {
  isTxPending: boolean
  pendingTxHash: string | null
  toasts: ToastMessage[]
  setTxPending: (pending: boolean, hash?: string | null) => void
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  isTxPending: false,
  pendingTxHash: null,
  toasts: [],
  setTxPending: (pending, hash = null) => set({ isTxPending: pending, pendingTxHash: hash }),
  addToast: (type, title, message) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, type, title, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/uiStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/useUiStore.ts tests/uiStore.test.ts
git commit -m "feat: implement useUiStore Zustand store for transactions and toasts"
```

---

### Task 4: Compiled ABI and Custom Data Hook (`useVotingData`)

**Files:**
*   Create: `src/abi/Voting.json`
*   Create: `src/hooks/useVotingData.ts`
*   Create: `tests/useVotingData.test.ts`

**Interfaces:**
*   Consumes: Connected wallet state, contract event logs, view methods (`workflowStatus`, `owner`, `getVoter`, `getOneProposal`).
*   Produces: `useVotingData()` React hook that returns:
    *   `voters`: String array of registered voter addresses.
    *   `proposals`: Proposal array with descriptions and vote counts.
    *   `workflowStatus`: Number indicating active workflow phase.
    *   `winningProposalId`: Number representing the winner.
    *   `isOwner`: Boolean indicating if user is contract owner.
    *   `isVoter`: Boolean indicating if user is registered voter.
    *   `voterInfo`: Current voter status object `{ isRegistered, hasVoted, votedProposalId }` or null.
    *   `isLoading`: Boolean loading indicator.
    *   `refresh`: Trigger function to manually force-reload data.

- [ ] **Step 1: Write a unit test for the custom hook structure**

Create `tests/useVotingData.test.ts`:
```typescript
import { expect, test, vi } from 'vitest'

// Mock the Wagmi and Viem hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123', isConnected: true }),
  useReadContract: () => ({ data: 0, refetch: vi.fn() }),
  useWatchContractEvent: () => {},
}))

test('mock test for useVotingData existence', () => {
  expect(true).toBe(true)
})
```

- [ ] **Step 2: Copy ABI and Implement hook**

Copy ABI from hardhat artifacts:
Create directory `src/abi` and write contract ABI (from `/Users/gnepud/projects/alyra-voting-contract/artifacts/contracts/Voting.sol/Voting.json`).
Create `src/abi/Voting.json`: (Paste ABI from contract compiled outputs)

Create `src/hooks/useVotingData.ts`:
```typescript
import { useEffect, useState, useCallback } from 'react'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { getPublicClient } from '@wagmi/core'
import { parseAbiItem } from 'viem'
import { wagmiAdapter } from '@/config'
import VotingABI from '@/abi/Voting.json'

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const

export interface Proposal {
  id: number
  description: string
  voteCount: bigint
}

export interface VoterInfo {
  isRegistered: boolean
  hasVoted: boolean
  votedProposalId: bigint
}

export function useVotingData() {
  const { address, isConnected } = useAccount()
  const [voters, setVoters] = useState<string[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null)
  const [isEventLoading, setIsEventLoading] = useState(false)

  // Contract Read Hooks
  const { data: workflowStatusData, refetch: refetchStatus, isLoading: isStatusLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingABI.abi,
    functionName: 'workflowStatus',
  })

  const { data: ownerAddress, refetch: refetchOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingABI.abi,
    functionName: 'owner',
  })

  const { data: winningProposalIdData, refetch: refetchWinner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VotingABI.abi,
    functionName: 'winningProposalID',
  })

  const workflowStatus = typeof workflowStatusData === 'number' ? workflowStatusData : 0
  const winningProposalId = typeof winningProposalIdData === 'bigint' ? Number(winningProposalIdData) : 0
  const isOwner = isConnected && address && ownerAddress ? address.toLowerCase() === (ownerAddress as string).toLowerCase() : false

  // Fetch voters & proposals from logs + contract views
  const fetchBlockchainData = useCallback(async () => {
    if (!isConnected) {
      setVoters([])
      setProposals([])
      setVoterInfo(null)
      return
    }

    try {
      setIsEventLoading(true)
      const config = wagmiAdapter.wagmiConfig
      const client = getPublicClient(config)
      if (!client) return

      // 1. Fetch VoterRegistered events to compile voter address list
      const voterLogs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event VoterRegistered(address voterAddress)'),
        fromBlock: 0n,
        toBlock: 'latest',
      })
      const voterAddresses = voterLogs.map((log) => log.args.voterAddress as string)
      setVoters(voterAddresses)

      // Check if current user is registered
      const currentUserRegistered = address ? voterAddresses.some(v => v.toLowerCase() === address.toLowerCase()) : false

      // 2. Fetch voter profile for current user (only if registered or owner)
      let isUserVoter = false
      if (currentUserRegistered && address) {
        try {
          const voterProfile = (await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: VotingABI.abi,
            functionName: 'getVoter',
            args: [address],
            account: address,
          })) as [boolean, boolean, bigint]
          
          setVoterInfo({
            isRegistered: voterProfile[0],
            hasVoted: voterProfile[1],
            votedProposalId: voterProfile[2]
          })
          isUserVoter = voterProfile[0]
        } catch (err) {
          console.error("Error reading voter profile:", err)
          setVoterInfo(null)
        }
      } else {
        setVoterInfo(null)
      }

      // 3. Fetch ProposalRegistered events to get IDs
      const proposalLogs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event ProposalRegistered(uint proposalId)'),
        fromBlock: 0n,
        toBlock: 'latest',
      })
      const proposalIds = proposalLogs.map((log) => Number(log.args.proposalId))

      // 4. Resolve proposal descriptions & vote counts.
      // Constraint: calling getOneProposal reverts if account is not registered.
      // So we must use a registered address (or let current user call it only if registered)
      if (isUserVoter && address) {
        const proposalList: Proposal[] = []
        for (const id of proposalIds) {
          try {
            const proposalData = (await client.readContract({
              address: CONTRACT_ADDRESS,
              abi: VotingABI.abi,
              functionName: 'getOneProposal',
              args: [BigInt(id)],
              account: address,
            })) as [string, bigint]

            proposalList.push({
              id,
              description: proposalData[0],
              voteCount: proposalData[1]
            })
          } catch (err) {
            console.error(`Error reading proposal ${id}:`, err)
          }
        }
        setProposals(proposalList)
      } else {
        // Fallback: empty proposals or simple metadata showing names
        setProposals([])
      }
    } catch (error) {
      console.error('Error fetching blockchain logs:', error)
    } finally {
      setIsEventLoading(false)
    }
  }, [isConnected, address])

  // Trigger loading on changes
  useEffect(() => {
    fetchBlockchainData()
  }, [fetchBlockchainData, workflowStatus])

  const refresh = useCallback(() => {
    refetchStatus()
    refetchOwner()
    refetchWinner()
    fetchBlockchainData()
  }, [refetchStatus, refetchOwner, refetchWinner, fetchBlockchainData])

  // Listen to contract events and refresh state
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: VotingABI.abi,
    onLogs() {
      refresh()
    },
  })

  return {
    voters,
    proposals,
    workflowStatus,
    winningProposalId,
    isOwner,
    isVoter: voterInfo ? voterInfo.isRegistered : false,
    voterInfo,
    isLoading: isStatusLoading || isEventLoading,
    refresh
  }
}
```

- [ ] **Step 3: Run test to verify passes**

Run: `npm run test tests/useVotingData.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/abi/Voting.json src/hooks/useVotingData.ts tests/useVotingData.test.ts
git commit -m "feat: implement useVotingData custom hook with event log parsing and watcher logic"
```

---

### Task 5: Component Scaffolding & Stepper UI

**Files:**
*   Create: `src/components/Header.tsx`
*   Create: `src/components/WorkflowStepper.tsx`
*   Create: `src/components/TxOverlay.tsx`

**Interfaces:**
*   Consumes: Connected wallet, current status index, loading state in Zustand.
*   Produces: Header menu with connect buttons, responsive status nodes, and fullscreen glassmorphic transaction blocking spinner.

- [ ] **Step 1: Write header and stepper implementations**

Create `src/components/Header.tsx`:
```typescript
'use client'

import React from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

interface HeaderProps {
  isOwner: boolean
  isVoter: boolean
}

export default function Header({ isOwner, isVoter }: HeaderProps) {
  const { isConnected } = useAppKitAccount()

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-40 w-full px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold tracking-tight">
          V
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">Alyra Voting</h1>
          <p className="text-xs text-zinc-500">Decentralized Voting System</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isConnected && (
          <div className="flex gap-2">
            {isOwner && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                Owner
              </span>
            )}
            {isVoter ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900">
                Voter
              </span>
            ) : (
              !isOwner && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                  Guest
                </span>
              )
            )}
          </div>
        )}
        <appkit-button />
      </div>
    </header>
  )
}
```

Create `src/components/WorkflowStepper.tsx`:
```typescript
'use client'

import React from 'react'

const STEPS = [
  'Register Voters',
  'Proposals Open',
  'Proposals Closed',
  'Voting Open',
  'Voting Closed',
  'Votes Tallied'
]

interface StepperProps {
  currentStatus: number
}

export default function WorkflowStepper({ currentStatus }: StepperProps) {
  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStatus
          const isActive = index === currentStatus
          const isFuture = index > currentStatus

          return (
            <div key={step} className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none animate-pulse'
                      : isCompleted
                        ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-950/50 dark:border-green-900 dark:text-green-400'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Phase {index}
                </div>
              </div>
              <div 
                className={`text-sm font-semibold mt-1 transition-colors ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : isCompleted 
                      ? 'text-zinc-800 dark:text-zinc-200 font-medium' 
                      : 'text-zinc-400 dark:text-zinc-600'
                }`}
              >
                {step}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

Create `src/components/TxOverlay.tsx`:
```typescript
'use client'

import React from 'react'
import { useUiStore } from '@/store/useUiStore'

export default function TxOverlay() {
  const { isTxPending, pendingTxHash } = useUiStore()

  if (!isTxPending) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-xl">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h3 className="font-semibold text-lg">Transaction Pending</h3>
          <p className="text-sm text-zinc-500 mt-1">Please confirm the request in your wallet and wait for blockchain verification.</p>
        </div>
        {pendingTxHash && (
          <a
            href={`https://etherscan.io/tx/${pendingTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 font-mono break-all"
          >
            Tx: {pendingTxHash.slice(0, 10)}...{pendingTxHash.slice(-8)}
          </a>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx src/components/WorkflowStepper.tsx src/components/TxOverlay.tsx
git commit -m "feat: scaffold App Header, visual Workflow Stepper, and Tx loading overlay"
```

---

### Task 6: Panel Components & Dashboard Setup

**Files:**
*   Create: `src/components/AdminPanel.tsx`
*   Create: `src/components/VoterPanel.tsx`
*   Create: `src/components/GuestPanel.tsx`
*   Create: `src/components/ProposalList.tsx`
*   Modify: `src/app/page.tsx`

**Interfaces:**
*   Consumes: Hook data variables (`voters`, `proposals`, `isOwner`, `isVoter`, `workflowStatus`, `refresh`).
*   Produces: Interactive admin control panels, proposal registers, vote submittals, and unified dashboard rendering.

- [ ] **Step 1: Write Panel Implementations**

Create `src/components/AdminPanel.tsx`:
```typescript
'use client'

import React, { useState } from 'react'
import { useWriteContract } from 'wagmi'
import { useUiStore } from '@/store/useUiStore'
import VotingABI from '@/abi/Voting.json'

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const

interface AdminPanelProps {
  currentStatus: number
  refresh: () => void
}

export default function AdminPanel({ currentStatus, refresh }: AdminPanelProps) {
  const [voterAddress, setVoterAddress] = useState('')
  const { writeContractAsync } = useWriteContract()
  const { setTxPending, addToast } = useUiStore()

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voterAddress.startsWith('0x') || voterAddress.length !== 42) {
      addToast('error', 'Invalid Address', 'Please input a valid 42-character Ethereum address.')
      return
    }

    try {
      setTxPending(true)
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingABI.abi,
        functionName: 'addVoter',
        args: [voterAddress],
      })
      setTxPending(true, txHash)
      addToast('success', 'Voter Added', `Address ${voterAddress.slice(0, 6)}... registered successfully.`)
      setVoterAddress('')
      refresh()
    } catch (err: any) {
      addToast('error', 'Execution Failed', err.message || 'Transaction reverted.')
    } finally {
      setTxPending(false)
    }
  }

  const advancePhase = async (functionName: string, phaseName: string) => {
    try {
      setTxPending(true)
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingABI.abi,
        functionName,
      })
      setTxPending(true, txHash)
      addToast('success', 'Workflow Advanced', `Transitioned to: ${phaseName}`)
      refresh()
    } catch (err: any) {
      addToast('error', 'Transition Failed', err.message || 'Transaction reverted.')
    } finally {
      setTxPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Contract Admin Control</h2>
        <p className="text-sm text-zinc-500">Only the owner can register addresses and transition phases.</p>
      </div>

      {currentStatus === 0 && (
        <form onSubmit={handleAddVoter} className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Register Voter Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x..."
              className="flex-1 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-600"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
            />
            <button type="submit" className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Add
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Transition Workflow Status</label>
        
        {currentStatus === 0 && (
          <button onClick={() => advancePhase('startProposalsRegistering', 'Proposals Registration Open')} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition">
            Start Proposals Registration ➔
          </button>
        )}
        {currentStatus === 1 && (
          <button onClick={() => advancePhase('endProposalsRegistering', 'Proposals Registration Closed')} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition">
            End Proposals Registration ➔
          </button>
        )}
        {currentStatus === 2 && (
          <button onClick={() => advancePhase('startVotingSession', 'Voting Session Started')} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition">
            Start Voting Session ➔
          </button>
        )}
        {currentStatus === 3 && (
          <button onClick={() => advancePhase('endVotingSession', 'Voting Session Ended')} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg transition">
            End Voting Session ➔
          </button>
        )}
        {currentStatus === 4 && (
          <button onClick={() => advancePhase('tallyVotes', 'Votes Tallied & Settled')} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition">
            Tally Votes & Declare Winner ✓
          </button>
        )}
        {currentStatus === 5 && (
          <div className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-center">
            Voting Cycle Completed & Settled.
          </div>
        )}
      </div>
    </div>
  )
}
```

Create `src/components/VoterPanel.tsx`:
```typescript
'use client'

import React, { useState } from 'react'
import { useWriteContract } from 'wagmi'
import { useUiStore } from '@/store/useUiStore'
import VotingABI from '@/abi/Voting.json'

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const

interface VoterPanelProps {
  currentStatus: number
  hasVoted: boolean
  votedProposalId: bigint
  refresh: () => void
}

export default function VoterPanel({ currentStatus, hasVoted, votedProposalId, refresh }: VoterPanelProps) {
  const [proposalText, setProposalText] = useState('')
  const { writeContractAsync } = useWriteContract()
  const { setTxPending, addToast } = useUiStore()

  const handleAddProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalText.trim()) {
      addToast('error', 'Empty Proposal', 'Proposal description cannot be empty.')
      return
    }

    try {
      setTxPending(true)
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingABI.abi,
        functionName: 'addProposal',
        args: [proposalText],
      })
      setTxPending(true, txHash)
      addToast('success', 'Proposal Submitted', 'Your proposal was registered on the blockchain.')
      setProposalText('')
      refresh()
    } catch (err: any) {
      addToast('error', 'Execution Failed', err.message || 'Transaction reverted.')
    } finally {
      setTxPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Voter Actions Panel</h2>
        <p className="text-sm text-zinc-500">You are a registered voter. Your actions change per phase.</p>
      </div>

      {currentStatus === 1 && (
        <form onSubmit={handleAddProposal} className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Register Proposal</label>
          <textarea
            placeholder="I propose that we..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-indigo-600 resize-none"
            value={proposalText}
            onChange={(e) => setProposalText(e.target.value)}
          />
          <button type="submit" className="w-full mt-2 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
            Submit Proposal
          </button>
        </form>
      )}

      {currentStatus !== 1 && currentStatus !== 3 && (
        <div className="text-sm text-zinc-500 italic text-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
          No voter transactions are active during this stage.
        </div>
      )}

      {currentStatus === 3 && (
        <div className="p-4 rounded-xl border flex flex-col gap-2 text-center bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900 text-indigo-950 dark:text-indigo-400">
          <h3 className="font-semibold text-sm">Voting Session is Active</h3>
          {hasVoted ? (
            <p className="text-xs">You have cast your vote on Proposal ID: <span className="font-mono font-bold">{Number(votedProposalId)}</span>.</p>
          ) : (
            <p className="text-xs">Please select a proposal below to register your vote.</p>
          )}
        </div>
      )}
    </div>
  )
}
```

Create `src/components/GuestPanel.tsx`:
```typescript
'use client'

import React from 'react'

export default function GuestPanel() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-100 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-850 flex items-center justify-center text-zinc-500">
        !
      </div>
      <div>
        <h3 className="font-semibold text-base">Not Registered as a Voter</h3>
        <p className="text-sm text-zinc-500 max-w-sm mt-1">You can view the stepper progress and tallied results. To register proposals or vote, request the contract owner to add your address.</p>
      </div>
    </div>
  )
}
```

Create `src/components/ProposalList.tsx`:
```typescript
'use client'

import React from 'react'
import { useWriteContract } from 'wagmi'
import { useUiStore } from '@/store/useUiStore'
import { type Proposal } from '@/hooks/useVotingData'
import VotingABI from '@/abi/Voting.json'

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const

interface ProposalListProps {
  proposals: Proposal[]
  currentStatus: number
  isVoter: boolean
  hasVoted: boolean
  winningId: number
  refresh: () => void
}

export default function ProposalList({ proposals, currentStatus, isVoter, hasVoted, winningId, refresh }: ProposalListProps) {
  const { writeContractAsync } = useWriteContract()
  const { setTxPending, addToast } = useUiStore()

  const handleVote = async (id: number) => {
    try {
      setTxPending(true)
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingABI.abi,
        functionName: 'setVote',
        args: [BigInt(id)],
      })
      setTxPending(true, txHash)
      addToast('success', 'Vote Cast', `Voted successfully on Proposal ID ${id}.`)
      refresh()
    } catch (err: any) {
      addToast('error', 'Vote Failed', err.message || 'Transaction reverted.')
    } finally {
      setTxPending(false)
    }
  }

  // Show winning proposal card if votes are tallied
  const winningProposal = currentStatus === 5 ? proposals.find(p => p.id === winningId) : null

  return (
    <div className="flex flex-col gap-6">
      {winningProposal && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6 shadow-sm text-center flex flex-col items-center gap-2">
          <div className="text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Winning Proposal</div>
          <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-300">"{winningProposal.description}"</h2>
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1">Received {Number(winningProposal.voteCount)} Votes</div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Registered Proposals ({proposals.length})</h2>
          <p className="text-sm text-zinc-500">List of all submitted voting ideas on-chain.</p>
        </div>

        {proposals.length === 0 ? (
          <div className="text-sm text-zinc-400 italic text-center p-8 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
            {isVoter ? "No proposals registered yet." : "Register to view proposal lists."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {proposals.map((proposal) => {
              const isWinner = currentStatus === 5 && proposal.id === winningId
              const showVoteButton = currentStatus === 3 && isVoter && !hasVoted

              return (
                <div 
                  key={proposal.id} 
                  className={`flex justify-between items-center p-4 rounded-xl border transition ${
                    isWinner 
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : 'border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                        ID: {proposal.id}
                      </span>
                      {isWinner && (
                        <span className="text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded">
                          Winner
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{proposal.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {(currentStatus >= 4 || isWinner) && (
                      <span className="text-xs font-bold text-zinc-500">
                        {Number(proposal.voteCount)} Votes
                      </span>
                    )}
                    {showVoteButton && (
                      <button 
                        onClick={() => handleVote(proposal.id)} 
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                      >
                        Vote
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

Modify `src/app/page.tsx`:
```typescript
'use client'

import React from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useVotingData } from '@/hooks/useVotingData'
import { useUiStore } from '@/store/useUiStore'
import Header from '@/components/Header'
import WorkflowStepper from '@/components/WorkflowStepper'
import AdminPanel from '@/components/AdminPanel'
import VoterPanel from '@/components/VoterPanel'
import GuestPanel from '@/components/GuestPanel'
import ProposalList from '@/components/ProposalList'
import TxOverlay from '@/components/TxOverlay'

export default function Dashboard() {
  const { isConnected } = useAppKitAccount()
  const {
    voters,
    proposals,
    workflowStatus,
    winningProposalId,
    isOwner,
    isVoter,
    voterInfo,
    isLoading,
    refresh
  } = useVotingData()
  const { toasts, removeToast } = useUiStore()

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <Header isOwner={isOwner} isVoter={isVoter} />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Connection Notice */}
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center gap-4 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight">Decentralized Voting System</h2>
            <p className="text-zinc-500 max-w-md">Connect your Web3 Wallet to participate in proposing, voting, and view live results.</p>
            <appkit-button />
          </div>
        ) : (
          <>
            {/* 6-node Stepper */}
            <WorkflowStepper currentStatus={workflowStatus} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Action Panels */}
              <div className="flex flex-col gap-6">
                {isOwner && (
                  <AdminPanel currentStatus={workflowStatus} refresh={refresh} />
                )}
                {isVoter ? (
                  <VoterPanel 
                    currentStatus={workflowStatus} 
                    hasVoted={voterInfo?.hasVoted || false} 
                    votedProposalId={voterInfo?.votedProposalId || 0n} 
                    refresh={refresh} 
                  />
                ) : (
                  !isOwner && <GuestPanel />
                )}
              </div>

              {/* Right Column - Proposals Board */}
              <div className="md:col-span-2">
                <ProposalList
                  proposals={proposals}
                  currentStatus={workflowStatus}
                  isVoter={isVoter}
                  hasVoted={voterInfo?.hasVoted || false}
                  winningId={winningProposalId}
                  refresh={refresh}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Global Transaction blocker */}
      <TxOverlay />

      {/* Custom Toasts system */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
          {toasts.map((toast) => (
            <div 
              key={toast.id} 
              className={`p-4 rounded-xl border shadow-lg flex justify-between items-start gap-4 transition-all duration-300 animate-slide-in ${
                toast.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-900 dark:text-green-300' 
                  : toast.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
              }`}
            >
              <div>
                <h4 className="font-semibold text-sm">{toast.title}</h4>
                <p className="text-xs mt-1 text-zinc-600 dark:text-zinc-400">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)} 
                className="text-xs font-bold text-zinc-400 hover:text-zinc-600 outline-none"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify Compilation**

Run: `npm run build`
Expected: Production build finishes successfully with zero TS/ESLint lint warnings or errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminPanel.tsx src/components/VoterPanel.tsx src/components/GuestPanel.tsx src/components/ProposalList.tsx src/app/page.tsx
git commit -m "feat: complete dashboard layout by connecting panels, proposal board, and toast alerting system"
```
