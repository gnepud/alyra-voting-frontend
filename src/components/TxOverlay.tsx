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
