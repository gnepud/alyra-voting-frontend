'use client'

import React from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

interface HeaderProps {
  isOwner: boolean
  isVoter: boolean
}

export default function Header({ isOwner, isVoter }: HeaderProps) {
  const { isConnected } = useAppKitAccount()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])

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
        {mounted && isConnected && (
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
