import { expect, test } from 'vitest'
import { projectId, networks, wagmiAdapter } from '../src/config'

test('exports correct Web3 configuration', () => {
  expect(projectId).toBe('b56e18d47c72ab683b10814fe9495694')
  expect(networks[0].id).toBe(11155111) // sepolia
  expect(wagmiAdapter).toBeDefined()
})
