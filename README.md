# Decentralized Voting DApp

A modern, responsive, and secure decentralized voting frontend built for the **Blockchain Developer** project. This DApp provides a web interface for the `Voting.sol` smart contract, guiding admins and voters through a strict 6-stage democratic workflow.

## 🚀 Deployed Contract & Network

*   **Network:** Ethereum Sepolia Testnet
*   **Contract Address:** [`0xf21e263a1a1E129b9392B4f30390071cAD5eD847`](https://sepolia.etherscan.io/address/0xf21e263a1a1E129b9392B4f30390071cAD5eD847)
*   **Etherscan Explorer:** [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0xf21e263a1a1E129b9392B4f30390071cAD5eD847)

---

## 🛠️ Technology Stack

*   **Core Framework:** [Next.js](https://nextjs.org/) (v16.2.10)
*   **Styling & Theme:** [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn](https://shadcn.com/)
*   **Web3 Adapter:** [Reown](https://reown.com/) + [Wagmi v3](https://wagmi.sh/) + [Viem](https://viem.sh/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Testing:** [Vitest](https://vitest.dev/)

---

## 🤖 AI-Assisted Development

This project was developed using **Antigravity** and the **Superpowers** plugin framework. 

Rather than writing code directly, the project followed a structured lifecycle:

### 1. Requirements & Brainstorming
Using the `brainstorming` skill, we thoroughly explored user requirements and Web3-specific technical constraints:
*   Addressed the hydration mismatch risks of Server-Side Rendered (SSR) Next.js apps when parsing connected wallet cookies.
*   Analyzed the `onlyVoters` access controls on the contract to design safe client-side RPC queries.

### 2. Design Specs & Written Plans
Before writing any code, we used the `writing-plans` skill to generate structured design specifications and step-by-step implementation plans. These planning documents are stored in the project's documentation folder:
*   [Design Specification](docs/superpowers/specs/2026-07-12-voting-frontend-design.md)
*   [Frontend Implementation Plan](docs/superpowers/plans/2026-07-12-voting-frontend-implementation.md)

### 3. Test-Driven Development (TDD)
We integrated Vitest unit and component tests early in the cycle using the `test-driven-development` skill. We wrote test suites in the `/tests` folder to validate:
*   UI rendering of the Header, Stepper, and Overlay components.
*   The logic and reactive state management in custom React hooks (`useVotingData`).
*   Global Zustand state stores (`useUiStore`).

### 4. Verification and Debugging
Using the `verification-before-completion` and `systematic-debugging` skills, we ran automated tests locally in parallel before committing code.

### 🧰 Integrated AI Coding Skills
To optimize developer productivity, we equipped the AI assistant with these specialized tools:
*   **`context7-cli`:** Fetched current libraries documentation to verify breaking changes and ensure correct usage of Wagmi v3 and Reown AppKit.
*   **`appkit`:** Guided the precise setup of Reown AppKit's SSR cookie recovery settings in Next.js.
*   **`shadcn`:** Streamlined component composition, atomic styling configurations, and the theme integration.

---

## ⚙️ Getting Started & Setup

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   A Reown Project ID (obtainable from [Reown Cloud](https://cloud.reown.com/))
*   An Ethereum RPC provider URL (e.g., Infura, Alchemy, or public Sepolia endpoints)

### 2. Environment Configuration
Create a `.env` file in the root directory (using the variables from `.env`):
```env
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0xf21e263a1a1E129b9392B4f30390071cAD5eD847
NEXT_PUBLIC_RPC_URL=your_sepolia_rpc_endpoint
NEXT_PUBLIC_START_BLOCK=11264486
```

### 3. Installation
Install the project dependencies:
```bash
npm install
```

### 4. Running the App
Run the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests
Run the test suite via Vitest:
```bash
npm run test
```

### 6. Build for Production
Build the optimized production package:
```bash
npm run build
```

---

## 📄 License
This project is for educational purposes as part of the Alyra Blockchain Developer certification. Feel free to copy, modify, and build upon it!
