# Design Specification: Alyra Voting Frontend

## Overview
This document specifies the design, architecture, and implementation details for the voting system frontend using Next.js, Reown AppKit, Wagmi (v3), Viem, Zustand, Tailwind CSS, and shadcn/ui. 

The frontend connects to an already deployed `Voting.sol` smart contract on the Hardhat Localhost network.

---

## 1. Objectives & Success Criteria
1. **Wallet Connection**: Smooth, responsive Web3 connection via Reown AppKit.
2. **Unified Dashboard**: An adaptive, single-page UI that shifts context depending on the user's role (Owner, Voter, Guest) and the active smart contract stage.
3. **Workflow Transparency**: A visual stepper displaying the contract’s 6 workflow statuses in real-time.
4. **Data Sync**: Immediate updates to the UI when contract events (voter registered, proposal added, vote cast, status changed) occur.
5. **No Redundant Queries**: Clean data hydration that avoids RPC reverts for non-voter/guest addresses (due to `onlyVoters` modifiers on contract getters).
6. **Polished Design**: Sleek glassmorphism, responsive Tailwind grids, clear status banners, and global transaction loading overlays.

---

## 2. Technology Stack & Packages
*   **Framework**: Next.js 16.2.10 (React 19.2.4) App Router
*   **Styling**: Tailwind CSS v4, PostCSS
*   **UI Components**: shadcn/ui (with Radix primitives, including Sonner)
*   **Web3 Integration**: Reown AppKit + Wagmi Adapter (v3) + Viem
*   **State Management**: Zustand (for client-side UI states like loading overlays)
*   **Theme Management**: next-themes (for dark/light mode propagation to Sonner)
*   **Client Queries**: TanStack React Query (v5)

---

## 3. Directory Structure
```
src/
├── app/
│   ├── favicon.ico
│   ├── globals.css          # Tailwind v4 directives and CSS theme variables
│   ├── layout.tsx           # SSR Cookie recovery, Page wrapper
│   └── page.tsx             # Unified Dashboard (main entrance)
├── components/
│   ├── ui/                  # shadcn/ui atomic elements
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   └── sonner.tsx       # shadcn/ui Sonner toaster component
│   ├── Header.tsx           # App navbar containing Title and Connect button
│   ├── WorkflowStepper.tsx  # Stage stepper for the 6 workflow statuses
│   ├── StatusBanner.tsx     # Role badge and contextual user helper notices
│   ├── AdminPanel.tsx       # Owner-only actions (register voter, advance workflow)
│   ├── VoterPanel.tsx       # Registered voter actions (submit proposal, vote buttons)
│   ├── GuestPanel.tsx       # Informational panel for non-registered addresses
│   ├── ProposalList.tsx     # Proposal board, voting inputs, and winner display
│   └── TxOverlay.tsx        # Global glassmorphic transaction pending loading screen
├── hooks/
│   └── useVotingData.ts     # Data aggregation hook: event scanning, reads, watchers
├── store/
│   └── useUiStore.ts        # Zustand UI store: transaction pending overlay
├── config/
│   └── index.ts             # AppKit config, Wagmi Adapter, networks (Hardhat Localhost)
└── abi/
    └── Voting.json          # Voting contract ABI
```

---

## 4. Web3 Adapter & Next.js SSR Integration

To prevent React hydration mismatches, the project uses Reown AppKit's SSR config, storing state in cookies and passing them from the server-rendered root layout to the client provider.

### Next.js Configuration (`next.config.ts`)
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

### AppKit Config (`src/config/index.ts`)
*   **Target Chain**: Hardhat Localhost (Chain ID: `31337`).
*   **Wagmi Adapter**: Initialized with `ssr: true`.
*   **Project ID**: Fallback to public testing key `b56e18d47c72ab683b10814fe9495694` if `.env.local` is missing.

### Root Layout (`src/app/layout.tsx`)
1. Reads headers asynchronously (`await headers()`).
2. Extracts cookies and passes them to the custom client Context provider.
3. Renders HTML and loads font styles.

---

## 5. Smart Contract Specifications

*   **Deploved Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (Hardhat Localhost).
*   **Workflow Phases (`WorkflowStatus` enum)**:
    1.  `0: RegisteringVoters`
    2.  `1: ProposalsRegistrationStarted`
    3.  `2: ProposalsRegistrationEnded`
    4.  `3: VotingSessionStarted`
    5.  `4: VotingSessionEnded`
    6.  `5: VotesTallied`

### ABI Operations Mapping
*   **Owner Actions**:
    *   `addVoter(address _addr)`: Requires stage `0`.
    *   `startProposalsRegistering()`: Transitions `0` -> `1`. Automatically creates Proposal `0` ("GENESIS").
    *   `endProposalsRegistering()`: Transitions `1` -> `2`.
    *   `startVotingSession()`: Transitions `2` -> `3`.
    *   `endVotingSession()`: Transitions `3` -> `4`.
    *   `tallyVotes()`: Transitions `4` -> `5`. Tallies proposal counts and sets `winningProposalID`.
*   **Voter Actions**:
    *   `addProposal(string _desc)`: Requires stage `1`.
    *   `setVote(uint _id)`: Requires stage `3`. Only one vote per voter.
*   **View Operations (Restricted by `onlyVoters` modifier)**:
    *   `getVoter(address _addr)`: Returns `{ isRegistered, hasVoted, votedProposalId }`.
    *   `getOneProposal(uint _id)`: Returns `{ description, voteCount }`.

---

## 6. Logic & State Architecture

### Custom Hook: `useVotingData.ts`
Because there is no getter to query all voters or proposals, this hook compiles state using event scanning:
1.  **Reads Connection Details**: Connected address and check if it is contract owner (queried via `owner()` view call).
2.  **Scans Historical Event Logs**:
    *   `VoterRegistered(address voterAddress)`: Aggregates list of all registered addresses.
    *   `ProposalRegistered(uint proposalId)`: Aggregates list of registered proposal IDs.
3.  **Applies Permission Safeguard**:
    *   Reads `getVoter(connectedAddress)` for the active user.
    *   If `isRegistered` is false, it **bypasses** calling `getOneProposal(id)` to avoid contract reverts. It exposes a placeholder empty list.
    *   If `isRegistered` is true, it queries `getOneProposal(id)` in parallel for all proposal IDs and populates the list of proposals.
4.  **Auto-sync Watcher**: Uses `useWatchContractEvent` for all main contract events. Emitting any transaction triggers a local state refresh.

### Zustand UI Store: `useUiStore.ts`
Controls asynchronous client UI states:
*   **Transaction State**: `isTxPending` (show modal blocker) and `pendingTxHash` (for Explorer links).

### Toast Notifications: shadcn Sonner
*   We use shadcn's **Sonner** (`toast` function calls) directly in components for success, info, and error notifications.
*   Theme changes are managed using `next-themes` to dynamically adapt the toast theme to light/dark.

---

## 7. Responsive UI Panels & Stepper Layout
The page displays a grid layout with components that show or hide dynamically:

1.  **Workflow Stepper**: Renders a 6-node flow. Nodes display a Checkmark if the stage is completed, a pulse border if active, and muted grey if future.
2.  **Status Notice**: A simple alert text explaining the active phase and instructions.
3.  **Role Badge**: Displavs next to wallet connection status (e.g. `[Owner]`, `[Voter]`, `[Guest]`).
4.  **Admin Portal** (Visible only to owner):
    *   Voter Registration panel: Text field to add voter address. Button disabled if workflow status is not `RegisteringVoters`.
    *   Workflow Manager panel: Buttons to advance to the next phase based on current status.
5.  **Voter Portal** (Visible to registered voters):
    *   Proposal Submission: Active during proposals stage.
    *   Voting panel: Selectable list of proposals.
6.  **Guest Screen**: Shows a notification explaining how to register if a non-registered address connects.
7.  **Proposals Board**: Shows list of proposals.
    *   If proposals are registered, displays descriptions.
    *   If voting is open, registered voters who haven't voted see a "Vote" button.
    *   If voting is closed/tallied, reveals vote counts.
    *   If status is `VotesTallied`, highlights the winning proposal in a celebratory banner.

---

## 8. Robust Error Handling & Edge Cases
*   **Wrong Network**: Renders a warning header if the user connects to a network other than Chain 31337 (Hardhat). Offers a switch-network button.
*   **Wallet Disconnection**: Restores guest view immediately.
*   **Reverted Transaction**: Catches Web3 transaction rejection errors (e.g., user declines MetaMask signature, or contract requirement fails) and pushes an error message to our shadcn Sonner toast notifications.
