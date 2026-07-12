import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test, describe, beforeEach } from 'vitest'
import TxOverlay from '../src/components/TxOverlay'
import { useUiStore } from '../src/store/useUiStore'

describe('TxOverlay Component', () => {
  beforeEach(() => {
    // Reset Zustand store state to defaults before each test
    useUiStore.setState({
      isTxPending: false,
      pendingTxHash: null,
      toasts: []
    })
  })

  test('renders nothing when there is no pending transaction', () => {
    const { container } = render(<TxOverlay />)
    expect(container.firstChild).toBeNull()
  })

  test('renders loading spinner and description when transaction is pending', () => {
    useUiStore.setState({ isTxPending: true })
    render(<TxOverlay />)

    expect(screen.getByText('Transaction Pending')).toBeInTheDocument()
    expect(screen.getByText(/Please confirm the request in your wallet/i)).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('renders Etherscan link when transaction hash is provided', () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    useUiStore.setState({ isTxPending: true, pendingTxHash: txHash })
    render(<TxOverlay />)

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', `https://etherscan.io/tx/${txHash}`)
    expect(link).toHaveTextContent('Tx: 0x12345678...90abcdef')
  })
})
