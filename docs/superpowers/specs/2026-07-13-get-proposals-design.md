# Design Specification: getProposals View Integration

## Overview
This document specifies the design, contract bindings, and frontend refactoring to fetch all proposals using the contract's new `getProposals()` view function, simplifying the frontend data loading cycle.

---

## 1. Smart Contract Operations
*   **Target Function**: `getProposals() external view returns (Proposal[] memory)`
*   **Requirements**: Caller must be a registered voter or the owner.
*   **Response**: Array of `Proposal` structs: `[{ description: string; voteCount: bigint }]`.

---

## 2. ABI Sync
*   Copy the compiled `Voting.json` artifact containing `getProposals` from:
    `/Users/gnepud/projects/alyra-voting-contract/artifacts/contracts/Voting.sol/Voting.json`
    to:
    `src/abi/Voting.json`

---

## 3. Frontend Refactoring (`useVotingData.ts`)
*   **Simplify Data Fetching**:
    *   Continue to fetch `VoterRegistered` logs to build the list of registered voter addresses.
    *   Remove all `ProposalRegistered` logs, `Voted` logs, `getOneProposal` read contract loops, and transaction input decoding fallbacks.
    *   Call `getProposals()` on the contract if the connected user is a voter or the owner.
    *   Map the returned array elements to the local `Proposal` type:
        ```typescript
        const proposalList = proposalsData.map((p, index) => ({
          id: index,
          description: p.description,
          voteCount: p.voteCount,
        }))
        ```
    *   For unauthorized guest users, set proposals to `[]`.

---

## 4. Testing
*   Update unit test mocks in `tests/useVotingData.test.ts` to mock `getProposals` calls instead of `getOneProposal` and transaction logs where applicable.
