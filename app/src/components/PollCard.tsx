"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { getProgram, candidatePda, pollPda, CandidateData, PollData, pollStatus } from "@/utils/program";

interface Props {
  poll: PollData;
  candidates: CandidateData[];
  onVoted: () => void;
}

const STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  upcoming: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ended: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const STATUS_LABELS = { active: "Live", upcoming: "Upcoming", ended: "Ended" };

function timeLabel(ts: BN): string {
  return new Date(ts.toNumber() * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function PollCard({ poll, candidates, onVoted }: Props) {
  const wallet = useAnchorWallet();
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const status = pollStatus(poll);

  const totalVotes = candidates.reduce((sum, c) => sum + c.candidateVotes.toNumber(), 0);

  const vote = useCallback(async (candidateName: string) => {
    if (!wallet) return;
    setVoting(candidateName);
    setError("");
    try {
      const program = await getProgram(wallet);
      const [ppda] = pollPda(poll.pollId);
      const [cpda] = candidatePda(poll.pollId, candidateName);
      await program.methods
        .vote(poll.pollId, candidateName)
        .accounts({ signer: wallet.publicKey, pollAccount: ppda, candidateAccount: cpda })
        .rpc();
      onVoted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.slice(0, 120));
    } finally {
      setVoting(null);
    }
  }, [wallet, poll, onVoted]);

  const topVotes = Math.max(...candidates.map((c) => c.candidateVotes.toNumber()), 1);

  return (
    <div className="rounded-2xl border border-solana-border bg-solana-card p-5 transition-all hover:border-solana-purple/40 hover:shadow-lg hover:shadow-solana-purple/10">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-bold text-white">{poll.pollName}</h3>
          {poll.pollDescription && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{poll.pollDescription}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
          {status === "active" && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Dates */}
      <div className="mb-4 flex gap-4 text-xs text-slate-500">
        <span>Start: <span className="text-slate-300">{timeLabel(poll.pollVotingStart)}</span></span>
        <span>End: <span className="text-slate-300">{timeLabel(poll.pollVotingEnd)}</span></span>
      </div>

      {/* Candidates */}
      <div className="space-y-2.5">
        {candidates.map((c) => {
          const votes = c.candidateVotes.toNumber();
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isLeading = votes === topVotes && totalVotes > 0;

          return (
            <div key={c.candidateName} className="group rounded-xl border border-solana-border bg-solana-dark p-3 transition hover:border-solana-purple/40">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isLeading && totalVotes > 0 && (
                    <span className="text-base" title="Leading">👑</span>
                  )}
                  <span className="text-sm font-semibold text-white">{c.candidateName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    {votes} vote{votes !== 1 ? "s" : ""} · {pct}%
                  </span>
                  {status === "active" && wallet && (
                    <button
                      onClick={() => vote(c.candidateName)}
                      disabled={!!voting}
                      className="rounded-lg bg-gradient-solana px-3 py-1 text-xs font-bold text-white transition hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {voting === c.candidateName ? "…" : "Vote"}
                    </button>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-solana-border">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: isLeading && totalVotes > 0
                      ? "linear-gradient(90deg, #9945FF, #14F195)"
                      : "#9945FF66",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">{totalVotes} total vote{totalVotes !== 1 ? "s" : ""}</span>
        {!wallet && status === "active" && (
          <span className="text-xs text-slate-500">Connect wallet to vote</span>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 break-words">{error}</div>
      )}
    </div>
  );
}
