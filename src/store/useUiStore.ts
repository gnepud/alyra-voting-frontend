import { create } from 'zustand'

interface UiState {
  isTxPending: boolean
  pendingTxHash: string | null
  setTxPending: (pending: boolean, hash?: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  isTxPending: false,
  pendingTxHash: null,
  setTxPending: (pending, hash = null) => set({ isTxPending: pending, pendingTxHash: hash }),
}))
