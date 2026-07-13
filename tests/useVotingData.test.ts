/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, vi, describe, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useVotingData } from '../src/hooks/useVotingData'

// Set up mocks
const mockUseAccount = vi.fn()
const mockUseReadContract = vi.fn()
const mockUseWatchContractEvent = vi.fn()
const mockGetLogs = vi.fn()
const mockReadContract = vi.fn()

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useReadContract: (args: any) => mockUseReadContract(args),
  useWatchContractEvent: (args: any) => mockUseWatchContractEvent(args),
}))

vi.mock('@wagmi/core', () => ({
  getPublicClient: () => ({
    getLogs: mockGetLogs,
    readContract: mockReadContract,
    getBlockNumber: vi.fn().mockResolvedValue(0n),
  }),
}))

vi.mock('@/config', () => ({
  wagmiAdapter: {
    wagmiConfig: {}
  },
  CONTRACT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  START_BLOCK: 0n
}))

describe('useVotingData hook', () => {
  const refetchStatus = vi.fn()
  const refetchOwner = vi.fn()
  const refetchWinner = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock useReadContract returns
    mockUseReadContract.mockImplementation((args: { functionName: string }) => {
      if (args.functionName === 'workflowStatus') {
        return { data: 1, refetch: refetchStatus, isLoading: false }
      }
      if (args.functionName === 'owner') {
        return { data: '0xOwnerAddress', refetch: refetchOwner, isLoading: false }
      }
      if (args.functionName === 'winningProposalID') {
        return { data: 0n, refetch: refetchWinner, isLoading: false }
      }
      return { data: undefined, refetch: vi.fn(), isLoading: false }
    })
  })

  test('returns default/empty lists when disconnected', async () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    })

    const { result } = renderHook(() => useVotingData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.voters).toEqual([])
    expect(result.current.proposals).toEqual([])
    expect(result.current.voterInfo).toBeNull()
    expect(result.current.isOwner).toBe(false)
    expect(result.current.isVoter).toBe(false)
  })

  test('correctly fetches data for a guest user (unregistered)', async () => {
    mockUseAccount.mockReturnValue({
      address: '0xGuestAddress',
      isConnected: true,
    })

    // Mock logs: VoterRegistered has some other voter address
    mockGetLogs.mockImplementation((args: { event: any }) => {
      const eventName = args.event?.name
      if (eventName === 'VoterRegistered') {
        return [
          { args: { voterAddress: '0xVoter1' } },
          { args: { voterAddress: '0xVoter2' } },
        ]
      }
      if (eventName === 'ProposalRegistered') {
        return [
          { args: { proposalId: 0n } },
          { args: { proposalId: 1n } },
        ]
      }
      return []
    })

    const { result } = renderHook(() => useVotingData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.voters).toEqual(['0xVoter1', '0xVoter2'])
    expect(result.current.proposals).toEqual([])
    expect(result.current.isVoter).toBe(false)
    expect(result.current.voterInfo).toBeNull()
    expect(result.current.isOwner).toBe(false)

    // Verify readContract was not called since guest cannot read proposals or voter profiles
    expect(mockReadContract).not.toHaveBeenCalled()
  })

  test('correctly fetches voter profile and proposal list for a registered voter', async () => {
    const voterAddress = '0xVoter1'
    mockUseAccount.mockReturnValue({
      address: voterAddress,
      isConnected: true,
    })

    // Mock logs: VoterRegistered lists the voter address
    mockGetLogs.mockImplementation((args: { event: any }) => {
      const eventName = args.event?.name
      if (eventName === 'VoterRegistered') {
        return [
          { args: { voterAddress } },
          { args: { voterAddress: '0xVoter2' } },
        ]
      }
      if (eventName === 'ProposalRegistered') {
        return [
          { args: { proposalId: 0n } },
          { args: { proposalId: 1n } },
        ]
      }
      return []
    })

    // Mock contract reads for voter and proposals
    mockReadContract.mockImplementation((args: { functionName: string; args: any[] }) => {
      if (args.functionName === 'getVoter') {
        // Returns { isRegistered, hasVoted, votedProposalId }
        return { isRegistered: true, hasVoted: true, votedProposalId: 1n }
      }
      if (args.functionName === 'getProposals') {
        return [
          { description: 'Genesis proposal description', voteCount: 0n },
          { description: 'First voter proposal description', voteCount: 2n },
        ]
      }
      return undefined
    })

    const { result } = renderHook(() => useVotingData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.voters).toEqual([voterAddress, '0xVoter2'])
    expect(result.current.isVoter).toBe(true)
    expect(result.current.voterInfo).toEqual({
      isRegistered: true,
      hasVoted: true,
      votedProposalId: 1n,
    })

    expect(result.current.proposals).toEqual([
      { id: 0, description: 'Genesis proposal description', voteCount: 0n },
      { id: 1, description: 'First voter proposal description', voteCount: 2n },
    ])
  })

  test('identifies contract owner correctly', async () => {
    mockUseAccount.mockReturnValue({
      address: '0xOwnerAddress',
      isConnected: true,
    })

    const { result } = renderHook(() => useVotingData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isOwner).toBe(true)
  })

  test('refresh function triggers refetching on contract reads and logs', async () => {
    mockUseAccount.mockReturnValue({
      address: '0xVoter1',
      isConnected: true,
    })
    mockGetLogs.mockResolvedValue([])

    const { result } = renderHook(() => useVotingData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(refetchStatus).toHaveBeenCalled()
    expect(refetchOwner).toHaveBeenCalled()
    expect(refetchWinner).toHaveBeenCalled()
  })

  test('subscribes to contract events', async () => {
    mockUseAccount.mockReturnValue({
      address: '0xVoter1',
      isConnected: true,
    })

    const { result } = renderHook(() => useVotingData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockUseWatchContractEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        abi: expect.any(Array),
        onLogs: expect.any(Function),
      })
    )
  })
})
