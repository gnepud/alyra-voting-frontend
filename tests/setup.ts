import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

process.env.NEXT_PUBLIC_REOWN_PROJECT_ID = 'b56e18d47c72ab683b10814fe9495694'
process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
process.env.NEXT_PUBLIC_RPC_URL = 'https://sepolia.infura.io/v3/mock'

afterEach(() => {
  cleanup()
})

// Mock window.matchMedia for next-themes
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
