import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

// This will be replaced with the generated IDL after `anchor build`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedIdl: any = null;

export const PROGRAM_ID = new PublicKey("BMg4Dniz8C6znDgyPjCQ1nQtsPMz2p8p8MK6HodNn6Vn");
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8899";

export function getProvider(wallet: AnchorWallet) {
  const connection = new Connection(RPC_URL, "confirmed");
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProgram(wallet: AnchorWallet): Promise<Program<any>> {
  if (!cachedIdl) {
    const res = await fetch("/idl/voting.json");
    cachedIdl = await res.json();
  }
  const provider = getProvider(wallet);
  return new Program(cachedIdl, provider);
}

export function pollPda(pollId: number | BN): [PublicKey, number] {
  const id = BN.isBN(pollId) ? pollId : new BN(pollId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), id.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
}

export function candidatePda(pollId: number | BN, candidateName: string): [PublicKey, number] {
  const id = BN.isBN(pollId) ? pollId : new BN(pollId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), id.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName)],
    PROGRAM_ID
  );
}

export interface PollData {
  pollId: BN;
  pollName: string;
  pollDescription: string;
  pollVotingStart: BN;
  pollVotingEnd: BN;
  pollOptionIndex: BN;
  publicKey: PublicKey;
}

export interface CandidateData {
  candidateName: string;
  candidateVotes: BN;
  publicKey: PublicKey;
}

export function pollStatus(poll: PollData): "upcoming" | "active" | "ended" {
  const now = Math.floor(Date.now() / 1000);
  const start = poll.pollVotingStart.toNumber();
  const end = poll.pollVotingEnd.toNumber();
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}
