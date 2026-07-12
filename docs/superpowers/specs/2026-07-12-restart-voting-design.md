# Design Specification: restartVoting integration

## Overview
This document specifies the design, contract bindings, and frontend implementation for resetting the voting cycle from the completed `VotesTallied` status back to `RegisteringVoters`.

---

## 1. Smart Contract Operations
*   **Target Function**: `restartVoting() external onlyOwner`
*   **Requirements**: Workflow status must be `WorkflowStatus.VotesTallied` (5).
*   **Effects**:
    *   Wipes the `voters` mapping and clears `votersAddresses` array.
    *   Wipes the `proposalsArray`.
    *   Resets `winningProposalID` to 0.
    *   Transitions `workflowStatus` to `WorkflowStatus.RegisteringVoters` (0).
    *   Emits `WorkflowStatusChange(WorkflowStatus.VotesTallied, WorkflowStatus.RegisteringVoters)`.

---

## 2. ABI Sync
*   We will copy the compiled `Voting.json` artifact containing `restartVoting` from the contract workspace:
    `/Users/gnepud/projects/alyra-voting-contract/artifacts/contracts/Voting.sol/Voting.json`
    to our frontend workspace at:
    `src/abi/Voting.json`

---

## 3. UI Flow & Safety confirmation
*   **AdminPanel Action Button**: When `currentStatus === 5` (Votes Tallied), the Admin Panel displays a warning reset button: `⚠️ Restart Voting Cycle`.
*   **Confirmation Dialog**: Clicking the button displays a modal dialog warning:
    *"Warning: This will permanently delete all registered voters, proposals, and vote counts from the blockchain. This action cannot be undone."*
    *   **Cancel**: Closes the dialog.
    *   **Confirm Reset**: Triggers the `restartVoting` transaction.
*   **Dynamic Response**: Once the transaction is mined on-chain, the `WorkflowStatusChange` event is watched, triggering a global refresh. The UI dynamically resets to the voter registration phase, clearing lists and profiles.

---

## 4. Error Handling
*   If the transaction fails or the wallet signature is rejected, a Sonner error toast displays the error message, and the modal is dismissed cleanly.
*   The transaction button disables and displays a loader spinner when the transaction is in progress.
