# shadcn Sonner Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom toast notification system in the voting dashboard with shadcn's Sonner component, incorporating theme synchronization via `next-themes`.

**Architecture:** We will configure the standard shadcn Sonner primitive component (`sonner.tsx`) using `next-themes` to support dynamic light/dark style styling. We will mount it globally in the root layout, dismantle the custom toast queue inside our Zustand store (`useUiStore.ts`), and update panels to trigger standard `toast` imports directly.

**Tech Stack:** Next.js 16, React 19, `sonner`, `next-themes`, Zustand.

## Global Constraints
*   **Toaster Configuration**: Render `<Toaster position="bottom-right" closeButton richColors />` in the root layout.
*   **Direct Imports**: Call `toast.success('...')` / `toast.error('...')` directly in panels instead of storing alerts in Zustand.
*   **No Placeholders**: All implementation code must be fully defined with no TBD/TODO statements.

---

### Task 1: Package Installation & Theme Setup

**Files:**
*   Modify: `package.json`
*   Modify: `src/context/index.tsx`
*   Modify: `tests/setup.ts` (if needed to mock matchMedia for next-themes in tests)

**Interfaces:**
*   Produces: `ThemeProvider` wrapping our app context tree to handle theme detection.

- [ ] **Step 1: Write failing mock test or check dependencies**

Run: `npm install sonner next-themes`
Update `tests/setup.ts` to mock `window.matchMedia` which is required by `next-themes` in Vitest JSDOM environment:
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

- [ ] **Step 2: Add ThemeProvider to Context Provider**

Modify `src/context/index.tsx`:
```typescript
'use client'

import React, { type ReactNode, useState } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { ThemeProvider } from 'next-themes'
import { projectId, networks, wagmiAdapter, metadata } from '@/config'

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

  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

- [ ] **Step 3: Verify tests and compile**

Run: `npm run test`
Expected: 22 tests passed (validating window.matchMedia mock).

- [ ] **Step 4: Commit**

```bash
git add package.json src/context/index.tsx tests/setup.ts
git commit -m "chore: install sonner and next-themes, configure ThemeProvider wrapper"
```

---

### Task 2: Build Sonner Primitive & Layout integration

**Files:**
*   Create: `src/components/ui/sonner.tsx`
*   Modify: `src/app/layout.tsx`

**Interfaces:**
*   Produces: Custom `<Toaster />` component styled with Tailwind variables.

- [ ] **Step 1: Implement Sonner Primitive**

Create `src/components/ui/sonner.tsx`:
```typescript
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-950 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-zinc-950 dark:group-[.toaster]:text-zinc-50 dark:group-[.toaster]:border-zinc-800',
          description: 'group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400',
          actionButton:
            'group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50 dark:group-[.toast]:bg-zinc-50 dark:group-[.toast]:text-zinc-900',
          cancelButton:
            'group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-400',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

- [ ] **Step 2: Mount Toaster in Root Layout**

Modify `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import { Toaster } from "@/components/ui/sonner";
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
          <Toaster position="bottom-right" closeButton richColors />
        </ContextProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sonner.tsx src/app/layout.tsx
git commit -m "feat: create Sonner primitive component and mount in layout"
```

---

### Task 3: Refactor Store, Components, and Clean up Custom Toasts

**Files:**
*   Modify: `src/store/useUiStore.ts`
*   Modify: `tests/uiStore.test.ts`
*   Modify: `src/app/page.tsx`
*   Modify: `src/components/AdminPanel.tsx`
*   Modify: `src/components/VoterPanel.tsx`
*   Modify: `src/components/ProposalList.tsx`

**Interfaces:**
*   Consumes: UI trigger calls inside panels.
*   Produces: Panels fully integrated with `toast` from `'sonner'`.

- [ ] **Step 1: Modify Zustand store and its unit tests**

Modify `src/store/useUiStore.ts`:
```typescript
import { create } from 'zustand'

interface UiState {
  isTxPending: boolean
  pendingTxHash: string | null
  setTxPending: (pending: boolean, hash?: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  isTxPending: false,
  pendingTxHash: null,
  setTxPending: (pending, hash = null) => set({ isTxPending: pending, pendingTxHash: hash }),
}))
```

Modify `tests/uiStore.test.ts`:
```typescript
import { expect, test, describe, beforeEach } from 'vitest'
import { useUiStore } from '../src/store/useUiStore'

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.getState().setTxPending(false, null)
  })

  test('initializes with default values', () => {
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(false)
    expect(state.pendingTxHash).toBeNull()
  })

  test('updates pending transaction state', () => {
    useUiStore.getState().setTxPending(true, '0xabc123')
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(true)
    expect(state.pendingTxHash).toBe('0xabc123')
  })
})
```

- [ ] **Step 2: Clean up Main Page (`src/app/page.tsx`)**

Remove toasts array and toast renderer loop from `src/app/page.tsx`:
Replace lines 26-28:
```typescript
  const { toasts, removeToast } = useUiStore()
```
with:
(nothing - delete this destructuring).

Delete the toasts rendering markup (lines 100-140) at the bottom of the page return block.

- [ ] **Step 3: Migrate Toasts in AdminPanel, VoterPanel, and ProposalList**

Modify `src/components/AdminPanel.tsx`:
- Import `toast` from `'sonner'`.
- Replace all `addToast('error', 'Invalid Address', '...')` with `toast.error('Please input a valid Ethereum address.')`.
- Replace `addToast('success', ...)` with `toast.success(...)`.

Modify `src/components/VoterPanel.tsx`:
- Import `toast` from `'sonner'`.
- Replace all `addToast` calls with `toast.success` and `toast.error` equivalents.

Modify `src/components/ProposalList.tsx`:
- Import `toast` from `'sonner'`.
- Replace all `addToast` calls with `toast.success` and `toast.error` equivalents.

- [ ] **Step 4: Verify complete test suite, linter, and build compilation**

Run: `npm run test`
Expected: 18 tests passed (reduced from 22 since we removed 4 toast-specific store tests).
Run: `npm run lint`
Expected: Clean linting check.
Run: `npm run build`
Expected: Production build compiles successfully.

- [ ] **Step 5: Commit**

```bash
git add src/store/useUiStore.ts tests/uiStore.test.ts src/app/page.tsx src/components/AdminPanel.tsx src/components/VoterPanel.tsx src/components/ProposalList.tsx
git commit -m "refactor: replace custom toast queue with sonner in Zustand and panels"
```
