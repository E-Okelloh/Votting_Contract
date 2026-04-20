"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-solana-border bg-solana-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-solana shadow-lg shadow-solana-purple/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 7h14M5 12h14M5 17h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">SolanaVote</h1>
            <p className="text-xs text-slate-400">On-chain polling</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-solana-border bg-solana-card px-3 py-1.5 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-solana-green" />
            <span className="text-xs font-medium text-slate-300">Devnet</span>
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
