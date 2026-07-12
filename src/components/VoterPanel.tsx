'use client'

import React, { useState } from 'react'
import { useWriteContract, usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config'
import { useUiStore } from '@/store/useUiStore'
import { toast } from 'sonner'
import VotingABI from '@/abi/Voting.json'

interface VoterPanelProps {
  currentStatus: number
  hasVoted: boolean
  votedProposalId: bigint
  refresh: () => void
}

export default function VoterPanel({ currentStatus, hasVoted, votedProposalId, refresh }: VoterPanelProps) {
  const [proposalText, setProposalText] = useState('')
  const { writeContractAsync } = useWriteContract()
  const { setTxPending } = useUiStore()
  const publicClient = usePublicClient()

  const handleAddProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalText.trim()) {
      toast.error('Proposal description cannot be empty.')
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

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      toast.success('Your proposal was registered on the blockchain.')
      setProposalText('')
      refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction reverted.'
      toast.error(message)
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
