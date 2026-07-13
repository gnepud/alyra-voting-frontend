# getProposals View Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the frontend proposal loading logic by replacing event logs scanning and individual loop reads with a single call to the new `getProposals()` view function.

**Architecture:** Sync the ABI. Refactor the `useVotingData` hook to query `getProposals()` for authorized users (voters/owner) and return an empty list for guests. Update unit test mocks to match this setup.

## Global Constraints
*   **Do Not Commit**: Per the user's instructions, do NOT create any Git commits until the user explicitly confirms. Keep all changes in the working tree.

---

### Task 1: Synchronize Contract ABI

**Files:**
*   Modify: `src/abi/Voting.json`

- [ ] **Step 1: Copy ABI file from contract project**

Copy `/Users/gnepud/projects/alyra-voting-contract/artifacts/contracts/Voting.sol/Voting.json` to `src/abi/Voting.json`.

---

### Task 2: Simplify useVotingData Hook

**Files:**
*   Modify: `src/hooks/useVotingData.ts`

- [ ] **Step 1: Replace logs queries and fallback loop with getProposals read call**

Update the `fetchBlockchainData` function to:
1. Remove `ProposalRegistered` and `Voted` log fetches.
2. Remove the `getOneProposal` loop and the Owner decoding fallback.
3. Call `getProposals` if `(isUserVoter || isOwner) && address`, and map elements to our `Proposal` type.

---

### Task 3: Update Hook Unit Tests

**Files:**
*   Modify: `tests/useVotingData.test.ts`

- [ ] **Step 1: Update mock readContract logic**

Update the mock `readContract` implementations in `tests/useVotingData.test.ts` to return mock arrays for the `getProposals` function name, matching the new structure.

- [ ] **Step 2: Run verification checks**

Run `npm run test` and `npm run lint` to verify that everything compiles and passes successfully. Run `npm run build` to confirm production static compilation.
