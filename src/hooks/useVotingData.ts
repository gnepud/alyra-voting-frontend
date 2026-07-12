import { useEffect, useState, useCallback } from 'react'
import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi'
import { getPublicClient } from '@wagmi/core'
import { parseAbiItem, decodeFunctionData } from 'viem'
import { wagmiAdapter, CONTRACT_ADDRESS } from '@/config'
import VotingABI from '@/abi/Voting.json'


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

      // 2. Fetch voter profile for current user (only if registered)
      let isUserVoter = false
      if (currentUserRegistered && address) {
        try {
          const voterProfile = (await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: VotingABI.abi,
            functionName: 'getVoter',
            args: [address],
            account: address,
          })) as { isRegistered: boolean; hasVoted: boolean; votedProposalId: bigint }
          
          setVoterInfo({
            isRegistered: voterProfile.isRegistered,
            hasVoted: voterProfile.hasVoted,
            votedProposalId: voterProfile.votedProposalId
          })
          isUserVoter = voterProfile.isRegistered
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
        const proposalPromises = proposalIds.map(async (id) => {
          try {
            const proposalData = (await client.readContract({
              address: CONTRACT_ADDRESS,
              abi: VotingABI.abi,
              functionName: 'getOneProposal',
              args: [BigInt(id)],
              account: address,
            })) as { description: string; voteCount: bigint }

            return {
              id,
              description: proposalData.description,
              voteCount: proposalData.voteCount,
            }
          } catch (err) {
            console.error(`Error reading proposal ${id}:`, err)
            return null
          }
        })
        const results = await Promise.all(proposalPromises)
        const proposalList = results.filter((p): p is Proposal => p !== null)
        setProposals(proposalList)
      } else if (isOwner && address) {
        // Fallback for owner/admin: decode transaction input to get description
        const proposalPromises = proposalLogs.map(async (log) => {
          const id = Number(log.args.proposalId)
          try {
            if (!log.transactionHash) return null
            const tx = await client.getTransaction({ hash: log.transactionHash })
            const decoded = decodeFunctionData({
              abi: VotingABI.abi,
              data: tx.input,
            })
            const description = decoded.args?.[0] as string || ''
            return {
              id,
              description,
              voteCount: 0n,
            }
          } catch (err) {
            console.error(`Error decoding proposal tx for ID ${id}:`, err)
            return null
          }
        })
        const results = await Promise.all(proposalPromises)
        const proposalList = results.filter((p): p is Proposal => p !== null)

        // Prepend GENESIS proposal if workflow Status >= 1 (ProposalsRegistrationStarted)
        if (workflowStatus >= 1) {
          proposalList.unshift({
            id: 0,
            description: 'GENESIS',
            voteCount: 0n,
          })
        }
        setProposals(proposalList)
      } else {
        setProposals([])
      }
    } catch (error) {
      console.error('Error fetching blockchain logs:', error)
    } finally {
      setIsEventLoading(false)
    }
  }, [isConnected, address, isOwner, workflowStatus])

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
