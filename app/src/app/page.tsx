"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { CreatePoll } from "@/components/CreatePoll";
import { PollList } from "@/components/PollList";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connected } = useWallet();
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-solana-dark">
      <Header />

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-solana-border bg-gradient-to-b from-solana-purple/5 to-transparent">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-solana-purple opacity-5 blur-3xl" />
          <div className="absolute -top-16 right-1/4 h-64 w-64 rounded-full bg-solana-green opacity-5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-solana-border bg-solana-card px-4 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-solana-green animate-pulse" />
            Powered by Solana &amp; Anchor
          </div>
          <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Trustless{" "}
            <span className="bg-gradient-solana bg-clip-text text-transparent">On-Chain</span>{" "}
            Voting
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-400">
            Create polls, add candidates, and cast votes — all recorded immutably on the Solana
            blockchain. No middlemen, no manipulation.
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-3 gap-4 rounded-2xl border border-solana-border bg-solana-card p-5">
          {[
            { label: "Network", value: "Devnet" },
            { label: "Program", value: "BMg4…6Vn" },
            { label: "Status", value: connected ? "Wallet Connected" : "Not Connected" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Active Polls</h3>
            <p className="text-sm text-slate-500">Click a candidate to cast your vote</p>
          </div>
          <CreatePoll onCreated={() => setRefresh((r) => r + 1)} />
        </div>

        {!connected && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300">
            Connect your wallet to create polls and vote. You can still view existing polls below.
          </div>
        )}

        <PollList refresh={refresh} />
      </main>

      {/* Footer */}
      <footer className="border-t border-solana-border py-8 text-center text-xs text-slate-600">
        Built with Anchor · Solana · Next.js · Tailwind CSS
      </footer>
    </div>
  );
}
