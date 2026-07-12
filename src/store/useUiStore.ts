import { create } from 'zustand'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}

interface UiState {
  isTxPending: boolean
  pendingTxHash: string | null
  toasts: ToastMessage[]
  setTxPending: (pending: boolean, hash?: string | null) => void
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  isTxPending: false,
  pendingTxHash: null,
  toasts: [],
  setTxPending: (pending, hash = null) => set({ isTxPending: pending, pendingTxHash: hash }),
  addToast: (type, title, message) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, type, title, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}))
