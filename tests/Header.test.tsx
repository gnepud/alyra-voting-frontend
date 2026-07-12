import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test, describe, vi } from 'vitest'
import Header from '../src/components/Header'

// Mock useAppKitAccount from @reown/appkit/react
const mockUseAppKitAccount = vi.fn()
vi.mock('@reown/appkit/react', () => ({
  useAppKitAccount: () => mockUseAppKitAccount()
}))

describe('Header Component', () => {
  test('renders logo and application title', () => {
    mockUseAppKitAccount.mockReturnValue({ isConnected: false })
    render(<Header isOwner={false} isVoter={false} />)
    
    expect(screen.getByText('Alyra Voting')).toBeInTheDocument()
    expect(screen.getByText('Decentralized Voting System')).toBeInTheDocument()
  })

  test('does not render role badges when disconnected', () => {
    mockUseAppKitAccount.mockReturnValue({ isConnected: false })
    render(<Header isOwner={true} isVoter={true} />)
    
    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
    expect(screen.queryByText('Voter')).not.toBeInTheDocument()
    expect(screen.queryByText('Guest')).not.toBeInTheDocument()
  })

  test('renders Owner badge when connected and isOwner is true', () => {
    mockUseAppKitAccount.mockReturnValue({ isConnected: true })
    render(<Header isOwner={true} isVoter={false} />)
    
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.queryByText('Voter')).not.toBeInTheDocument()
    expect(screen.queryByText('Guest')).not.toBeInTheDocument()
  })

  test('renders Voter badge when connected and isVoter is true', () => {
    mockUseAppKitAccount.mockReturnValue({ isConnected: true })
    render(<Header isOwner={false} isVoter={true} />)
    
    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
    expect(screen.getByText('Voter')).toBeInTheDocument()
    expect(screen.queryByText('Guest')).not.toBeInTheDocument()
  })

  test('renders Guest badge when connected and neither isOwner nor isVoter is true', () => {
    mockUseAppKitAccount.mockReturnValue({ isConnected: true })
    render(<Header isOwner={false} isVoter={false} />)
    
    expect(screen.queryByText('Owner')).not.toBeInTheDocument()
    expect(screen.queryByText('Voter')).not.toBeInTheDocument()
    expect(screen.getByText('Guest')).toBeInTheDocument()
  })
})
