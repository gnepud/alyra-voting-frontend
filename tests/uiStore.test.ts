import { expect, test, describe, beforeEach, vi } from 'vitest'
import { useUiStore } from '../src/store/useUiStore'

describe('useUiStore', () => {
  beforeEach(() => {
    // Reset Zustand store state to defaults before each test
    useUiStore.setState({
      isTxPending: false,
      pendingTxHash: null,
      toasts: []
    })
  })

  test('initializes with default values', () => {
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(false)
    expect(state.pendingTxHash).toBeNull()
    expect(state.toasts).toEqual([])
  })

  test('updates pending transaction state', () => {
    useUiStore.getState().setTxPending(true, '0xabc123')
    const state = useUiStore.getState()
    expect(state.isTxPending).toBe(true)
    expect(state.pendingTxHash).toBe('0xabc123')
  })

  test('adds and removes toasts', () => {
    useUiStore.getState().addToast('success', 'Success Title', 'Success Message')
    let state = useUiStore.getState()
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].type).toBe('success')
    expect(state.toasts[0].title).toBe('Success Title')
    expect(state.toasts[0].message).toBe('Success Message')
    expect(typeof state.toasts[0].id).toBe('string')

    const id = state.toasts[0].id
    useUiStore.getState().removeToast(id)
    state = useUiStore.getState()
    expect(state.toasts).toEqual([])
  })

  test('toasts auto-remove after 4000ms', () => {
    vi.useFakeTimers()
    useUiStore.getState().addToast('info', 'Info Title', 'Info Message')
    let state = useUiStore.getState()
    expect(state.toasts).toHaveLength(1)

    // Advance time by 4000ms
    vi.advanceTimersByTime(4000)
    state = useUiStore.getState()
    expect(state.toasts).toHaveLength(0)

    vi.useRealTimers()
  })
})
