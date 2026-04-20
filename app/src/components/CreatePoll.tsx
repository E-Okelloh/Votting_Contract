"use client";

import { useState } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { getProgram, pollPda, candidatePda } from "@/utils/program";

interface Props {
  onCreated: () => void;
}

export function CreatePoll({ onCreated }: Props) {
  const wallet = useAnchorWallet();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [candidates, setCandidates] = useState(["", ""]);

  function addCandidate() {
    setCandidates((c) => [...c, ""]);
  }
  function removeCandidate(i: number) {
    setCandidates((c) => c.filter((_, idx) => idx !== i));
  }
  function updateCandidate(i: number, val: string) {
    setCandidates((c) => c.map((v, idx) => (idx === i ? val : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;

    const validCandidates = candidates.filter((c) => c.trim());
    if (validCandidates.length < 2) {
      setError("Add at least 2 candidates.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Set start and end dates.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const program = await getProgram(wallet);
      const pollId = new BN(Date.now());
      const start = new BN(Math.floor(new Date(startDate).getTime() / 1000));
      const end = new BN(Math.floor(new Date(endDate).getTime() / 1000));

      const [pda] = pollPda(pollId);

      await program.methods
        .initializePoll(pollId, name.slice(0, 32), description.slice(0, 208), start, end)
        .accounts({ signer: wallet.publicKey, pollAccount: pda })
        .rpc();

      for (const cname of validCandidates) {
        const [cpda] = candidatePda(pollId, cname);
        await program.methods
          .initializeCandidate(pollId, cname.slice(0, 32))
          .accounts({ signer: wallet.publicKey, pollAccount: pda, candidateAccount: cpda })
          .rpc();
      }

      setOpen(false);
      setName(""); setDescription(""); setStartDate(""); setEndDate(""); setCandidates(["", ""]);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-gradient-solana px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-solana-purple/30 transition-all hover:scale-105 hover:shadow-solana-purple/50 active:scale-95"
      >
        <span className="text-lg leading-none">+</span>
        Create Poll
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-solana-border bg-solana-card shadow-2xl shadow-solana-purple/20">
            <div className="flex items-center justify-between border-b border-solana-border px-6 py-4">
              <h2 className="text-lg font-bold text-white">New Poll</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors text-xl">×</button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Poll name</label>
                <input
                  required maxLength={32} value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Best Programming Language"
                  className="w-full rounded-xl border border-solana-border bg-solana-dark px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-solana-purple focus:outline-none focus:ring-1 focus:ring-solana-purple transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Description</label>
                <textarea
                  maxLength={208} value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2} placeholder="Optional description…"
                  className="w-full rounded-xl border border-solana-border bg-solana-dark px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-solana-purple focus:outline-none focus:ring-1 focus:ring-solana-purple transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Start</label>
                  <input type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-solana-border bg-solana-dark px-3 py-2.5 text-sm text-white focus:border-solana-purple focus:outline-none focus:ring-1 focus:ring-solana-purple transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">End</label>
                  <input type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-solana-border bg-solana-dark px-3 py-2.5 text-sm text-white focus:border-solana-purple focus:outline-none focus:ring-1 focus:ring-solana-purple transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Candidates</label>
                <div className="space-y-2">
                  {candidates.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        maxLength={32} value={c} onChange={(e) => updateCandidate(i, e.target.value)}
                        placeholder={`Candidate ${i + 1}`}
                        className="flex-1 rounded-xl border border-solana-border bg-solana-dark px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-solana-purple focus:outline-none focus:ring-1 focus:ring-solana-purple transition"
                      />
                      {candidates.length > 2 && (
                        <button type="button" onClick={() => removeCandidate(i)}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-red-400 hover:bg-red-500/20 transition">×</button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addCandidate}
                  className="mt-2 text-xs font-medium text-solana-purple hover:text-solana-green transition">
                  + Add candidate
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-gradient-solana py-3 text-sm font-bold text-white shadow-lg shadow-solana-purple/30 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Creating on-chain…" : "Create Poll"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
