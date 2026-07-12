'use client'

import React from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useVotingData } from '@/hooks/useVotingData'
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
    </div>
  )
}
