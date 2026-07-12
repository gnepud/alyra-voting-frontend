'use client'

import React from 'react'
import { useWriteContract, usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS } from '@/config'
import { useUiStore } from '@/store/useUiStore'
import { toast } from 'sonner'
import { type Proposal } from '@/hooks/useVotingData'
import VotingABI from '@/abi/Voting.json'

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
  const { setTxPending } = useUiStore()
  const publicClient = usePublicClient()

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

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      toast.success(`Voted successfully on Proposal ID ${id}.`)
      refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction reverted.'
      toast.error(message)
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
          <h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-300">&ldquo;{winningProposal.description}&rdquo;</h2>
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
