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
    proposals,
    workflowStatus,
    winningProposalId,
    isOwner,
    isVoter,
    voterInfo,
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
            <p className="text-zinc-500 max-w-md">Connect your Web3 Wallet via Reown to participate in proposing, voting, and view live results.</p>
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
