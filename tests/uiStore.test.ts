import { expect, test, describe, beforeEach } from 'vitest'
import { useUiStore } from '../src/store/useUiStore'

describe('useUiStore', () => {
  beforeEach(() => {
    // Reset Zustand store state to defaults before each test
    useUiStore.setState({
      isTxPending: false,
      pendingTxHash: null,
    })
  })

  test('initializes with default values', () => {
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(false)
    expect(state.pendingTxHash).toBeNull()
  })

  test('updates pending transaction state', () => {
    useUiStore.getState().setTxPending(true, '0xabc123')
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(true)
    expect(state.pendingTxHash).toBe('0xabc123')
  })
})
