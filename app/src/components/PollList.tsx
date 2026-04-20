"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, PollData, CandidateData } from "@/utils/program";
import { PollCard } from "./PollCard";
import * as anchor from "@coral-xyz/anchor";

interface PollWithCandidates {
  poll: PollData;
  candidates: CandidateData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedIdl: any = null;

async function fetchIdl() {
  if (cachedIdl) return cachedIdl;
  const res = await fetch("/idl/voting.json");
  cachedIdl = await res.json();
  return cachedIdl;
}

const POLL_DISCRIMINATOR = Buffer.from(
  anchor.utils.sha256.hash("account:PollAccount").slice(0, 16),
  "hex"
).slice(0, 8);

const CANDIDATE_DISCRIMINATOR = Buffer.from(
  anchor.utils.sha256.hash("account:CandidateAccount").slice(0, 16),
  "hex"
).slice(0, 8);

export function PollList({ refresh }: { refresh: number }) {
  const { connection } = useConnection();
  const [polls, setPolls] = useState<PollWithCandidates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "ended">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const idl = await fetchIdl();
      const provider = new anchor.AnchorProvider(connection, {} as anchor.Wallet, {});
      const program = new anchor.Program(idl, provider);

      const [rawPolls, rawCandidates] = await Promise.all([
        program.account.pollAccount.all(),
        program.account.candidateAccount.all(),
      ]);

      const pollsWithCandidates: PollWithCandidates[] = rawPolls.map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const account = p.account as any;
        const poll: PollData = {
          pollId: account.pollId,
          pollName: account.pollName,
          pollDescription: account.pollDescription,
          pollVotingStart: account.pollVotingStart,
          pollVotingEnd: account.pollVotingEnd,
          pollOptionIndex: account.pollOptionIndex,
          publicKey: p.publicKey,
        };

        const candidates: CandidateData[] = rawCandidates
          .filter(() => {
            // Filter candidates by checking if their PDA matches this poll
            // (we can check by looking at pollId in seeds — simpler: match on-chain)
            return true; // anchor fetches all; we'll match by seeds below
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c): CandidateData => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ca = c.account as any;
            return {
              candidateName: ca.candidateName,
              candidateVotes: ca.candidateVotes,
              publicKey: c.publicKey,
            };
          })
          .filter((c) => {
            // Verify this candidate belongs to this poll via PDA derivation
            const { BN } = anchor;
            const [expected] = require("@solana/web3.js").PublicKey.findProgramAddressSync(
              [
                Buffer.from("candidate"),
                poll.pollId.toArrayLike(Buffer, "le", 8),
                Buffer.from(c.candidateName),
              ],
              PROGRAM_ID
            );
            return expected.equals(c.publicKey);
          });

        return { poll, candidates };
      });

      // Sort newest first
      pollsWithCandidates.sort(
        (a, b) => b.poll.pollVotingEnd.toNumber() - a.poll.pollVotingEnd.toNumber()
      );

      setPolls(pollsWithCandidates);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => { load(); }, [load, refresh]);

  const now = Math.floor(Date.now() / 1000);
  const filtered = polls.filter(({ poll }) => {
    if (filter === "all") return true;
    const start = poll.pollVotingStart.toNumber();
    const end = poll.pollVotingEnd.toNumber();
    if (filter === "active") return now >= start && now <= end;
    if (filter === "upcoming") return now < start;
    if (filter === "ended") return now > end;
    return true;
  });

  const counts = {
    all: polls.length,
    active: polls.filter(({ poll }) => now >= poll.pollVotingStart.toNumber() && now <= poll.pollVotingEnd.toNumber()).length,
    upcoming: polls.filter(({ poll }) => now < poll.pollVotingStart.toNumber()).length,
    ended: polls.filter(({ poll }) => now > poll.pollVotingEnd.toNumber()).length,
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {(["all", "active", "upcoming", "ended"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f
                ? "bg-gradient-solana text-white shadow-md shadow-solana-purple/30"
                : "border border-solana-border text-slate-400 hover:text-white hover:border-solana-purple/40"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${filter === f ? "bg-white/20" : "bg-solana-border"}`}>
              {counts[f]}
            </span>
          </button>
        ))}

        <button onClick={load} className="ml-auto rounded-full border border-solana-border px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:border-solana-purple/40 transition">
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-solana-border border-t-solana-purple" />
          <p className="text-sm text-slate-400">Loading polls from chain…</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={load} className="mt-3 text-xs text-red-300 hover:text-red-200 underline">Try again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-solana-border py-24 text-center">
          <div className="mb-3 text-4xl">🗳️</div>
          <p className="text-slate-400">No polls yet.</p>
          <p className="mt-1 text-sm text-slate-600">Create the first one above!</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(({ poll, candidates }) => (
          <PollCard
            key={poll.publicKey.toString()}
            poll={poll}
            candidates={candidates}
            onVoted={load}
          />
        ))}
      </div>
    </div>
  );
}
