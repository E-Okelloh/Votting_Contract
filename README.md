# Voting dApp — Solana + Anchor + Next.js

A decentralised voting application built on Solana. Anyone can create a poll, add candidates, and cast votes — all on-chain, with no central authority.

---

## What it does

| Feature | Description |
|---|---|
| Create Poll | Deploy a new poll with a name, description, and voting window |
| Add Candidates | Register candidates under any existing poll |
| Cast Vote | Vote for a candidate within the active voting window |
| Live Results | The frontend reads results directly from the blockchain |

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | [Anchor](https://www.anchor-lang.com/) (Rust) on Solana |
| Frontend | [Next.js 14](https://nextjs.org/) + TypeScript + Tailwind CSS |
| Wallet | `@solana/wallet-adapter` (Phantom, Backpack, etc.) |
| RPC | Devnet (configurable) |

---

## Prerequisites

Make sure you have these installed before you start:

- [Rust](https://www.rust-lang.org/tools/install) — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) — v1.18 or newer
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) — v0.31 or newer
- [Node.js](https://nodejs.org/) — v18 or newer
- [Yarn](https://yarnpkg.com/) — `npm install -g yarn`

Verify your setup:

```bash
solana --version
anchor --version
node --version
```

---

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/E-Okelloh/Votting_Contract.git
cd Votting_Contract
```

### 2. Install dependencies

```bash
# Root (Anchor tests)
yarn install

# Frontend
cd app && npm install && cd ..
```

### 3. Configure your Solana wallet

```bash
# Generate a new keypair if you don't have one
solana-keygen new

# Point to devnet
solana config set --url devnet

# Airdrop some SOL for gas fees (devnet only)
solana airdrop 2
```

### 4. Build and deploy the program

```bash
# Build the Anchor program
anchor build

# Deploy to devnet
anchor deploy
```

After deploying, copy the **Program ID** printed in the terminal and update it in two places:
- `Anchor.toml` → `[programs.localnet] voting = "<YOUR_PROGRAM_ID>"`
- `programs/voting/src/lib.rs` → `declare_id!("<YOUR_PROGRAM_ID>");`

Then rebuild: `anchor build`

### 5. Copy the IDL to the frontend

```bash
cp target/idl/voting.json app/public/idl/voting.json
```

### 6. Run the frontend

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Connect your wallet (switch it to **Devnet**) and start voting.

---

## Running tests

Tests use a local validator spun up automatically by Anchor.

```bash
anchor test
```

This will:
1. Start a local Solana validator
2. Deploy the program
3. Run the TypeScript test suite in `tests/voting.ts`

---

## Project structure

```
.
├── programs/
│   └── voting/
│       └── src/
│           └── lib.rs          # Anchor smart contract (all on-chain logic)
├── tests/
│   └── voting.ts               # Integration tests
├── app/                        # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # React components (Header, PollCard, etc.)
│   │   └── utils/              # Anchor client helpers
│   └── public/idl/             # Generated IDL (ABI) for the program
├── Anchor.toml                 # Anchor workspace config
└── Cargo.toml                  # Rust workspace config
```

---

## How the smart contract works

The program has three instructions:

### `initialize_poll`
Creates a new poll stored in a PDA (Program Derived Address) seeded by a unique poll ID.

### `initialize_candidate`
Adds a candidate to an existing poll. Each candidate lives in its own PDA seeded by `[poll_id, candidate_name]`.

### `vote`
Increments a candidate's vote counter. The program checks that the current timestamp falls inside the poll's voting window before accepting the vote.

---

## Common issues

**`Error: Account not found`** — Make sure you ran `anchor deploy` and that your wallet is on the same cluster (devnet).

**`Insufficient funds`** — Run `solana airdrop 2` to top up your devnet SOL.

**Wallet not connecting** — Switch your wallet extension (Phantom, etc.) to **Devnet** in its settings.

---

## License

MIT
