# restartVoting Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Owner-only "Restart Voting Cycle" button in the frontend which calls the contract's `restartVoting()` method.

**Architecture:** Sync the contract ABI. Update `AdminPanel.tsx` to handle the `restartVoting` transaction, display a confirmation dialog modal to prevent accidental resets, and execute the reset cleanly.

## Global Constraints
*   **Destructive Action Safeguard**: Implement a modal confirmation dialog explaining the deletion of voters and proposals. Only execute reset upon clicking the dialog's confirm button.
*   **Standard Directory Layout**: Do not modify config settings or external modules. Keep all handler modifications inside `src/components/AdminPanel.tsx`.

---

### Task 1: Synchronize Contract ABI

**Files:**
*   Modify: `src/abi/Voting.json`

- [ ] **Step 1: Copy ABI file from contract project**

Copy `/Users/gnepud/projects/alyra-voting-contract/artifacts/contracts/Voting.sol/Voting.json` to `src/abi/Voting.json`.

- [ ] **Step 2: Commit**

```bash
git add src/abi/Voting.json
git commit -m "chore: sync contract ABI containing restartVoting definition"
```

---

### Task 2: Implement Admin Panel Restart Button & Confirmation Modal

**Files:**
*   Modify: `src/components/AdminPanel.tsx`

**Interfaces:**
*   Produces: UI warning reset button under status 5, and confirmation overlay modal in `AdminPanel.tsx`.

- [ ] **Step 1: Update AdminPanel state, handler, and modal overlay**

Modify `src/components/AdminPanel.tsx` to:
1. Declare state `const [showConfirmModal, setShowConfirmModal] = useState(false)`.
2. Implement `handleRestartVoting` calling `restartVoting()`, waiting for receipt, showing success toast, and calling `refresh()`.
3. Add the warning button in phase 5.
4. Render the confirmation overlay modal if `showConfirmModal` is true.

Reference layout for phase 5 updates in `src/components/AdminPanel.tsx`:
```typescript
        {currentStatus === 5 && (
          <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-center">
              Voting Cycle Completed & Settled.
            </div>
            <button 
              onClick={() => setShowConfirmModal(true)} 
              className="w-full py-2 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 hover:text-red-700 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              ⚠️ Restart Voting Cycle
            </button>
          </div>
        )}
```

- [ ] **Step 2: Verify complete test suite, linter, and Next.js build compilation**

Run: `npm run test`
Expected: 20 tests pass.
Run: `npm run lint`
Expected: Clean check.
Run: `npm run build`
Expected: Production build compiles successfully.

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminPanel.tsx
git commit -m "feat: add restart voting button and confirmation dialog to AdminPanel"
```
