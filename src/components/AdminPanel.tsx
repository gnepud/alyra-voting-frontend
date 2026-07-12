'use client'

import React, { useState } from 'react'
import { useWriteContract, usePublicClient } from 'wagmi'
import { isAddress } from 'viem'
import { CONTRACT_ADDRESS } from '@/config'
import { useUiStore } from '@/store/useUiStore'
import { toast } from 'sonner'
import VotingABI from '@/abi/Voting.json'


interface AdminPanelProps {
  currentStatus: number
  refresh: () => void
}

export default function AdminPanel({ currentStatus, refresh }: AdminPanelProps) {
  const [voterAddress, setVoterAddress] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const { setTxPending } = useUiStore()
  const publicClient = usePublicClient()

  const handleAddVoter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddress(voterAddress)) {
      toast.error('Please input a valid Ethereum address.')
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

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      toast.success(`Address ${voterAddress.slice(0, 6)}... registered successfully.`)
      setVoterAddress('')
      refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction reverted.'
      toast.error(message)
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

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      toast.success(`Transitioned to: ${phaseName}`)
      refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction reverted.'
      toast.error(message)
    } finally {
      setTxPending(false)
    }
  }

  const handleRestartVoting = async () => {
    try {
      setTxPending(true)
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VotingABI.abi,
        functionName: 'restartVoting',
      })
      setTxPending(true, txHash)

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash })
      }

      toast.success('Voting cycle successfully restarted and reset to Voter Registration phase!')
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
          <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-center">
              Voting Cycle Completed & Settled.
            </div>
            <button 
              onClick={() => setShowConfirmModal(true)} 
              className="w-full py-2 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 hover:text-red-700 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2 font-medium"
            >
              ⚠️ Restart Voting Cycle
            </button>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-red-600">⚠️ Restart Voting Cycle?</h3>
              <p className="text-sm text-zinc-500 mt-2">
                This will permanently delete all registered voters, proposals, and vote counts from the blockchain. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-semibold border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  handleRestartVoting()
                }}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
