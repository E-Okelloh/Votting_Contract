import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { assert, expect } from "chai";
import { PublicKey } from "@solana/web3.js";

describe("voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Voting as Program<Voting>;

  const POLL_ID = new BN(1);
  const now = Math.floor(Date.now() / 1000);
  const START = new BN(now - 60);   // already started
  const END = new BN(now + 86400);  // 1 day from now

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), POLL_ID.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  function candidatePda(name: string) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("candidate"),
        POLL_ID.toArrayLike(Buffer, "le", 8),
        Buffer.from(name),
      ],
      program.programId
    )[0];
  }

  // ── 1. Create poll ──────────────────────────────────────────────────────────
  it("initializes a poll", async () => {
    await program.methods
      .initializePoll(POLL_ID, "Best Framework", "Vote for your favourite JS framework", START, END)
      .accounts({ signer: provider.wallet.publicKey, pollAccount: pollPda })
      .rpc();

    const poll = await program.account.pollAccount.fetch(pollPda);
    assert.equal(poll.pollName, "Best Framework");
    assert.equal(poll.pollDescription, "Vote for your favourite JS framework");
    assert.ok(poll.pollOptionIndex.eqn(0));
    assert.ok(poll.pollVotingStart.eq(START));
    assert.ok(poll.pollVotingEnd.eq(END));
  });

  // ── 2. Add candidates ───────────────────────────────────────────────────────
  const candidates = ["React", "Vue", "Svelte"];

  for (const name of candidates) {
    it(`adds candidate: ${name}`, async () => {
      await program.methods
        .initializeCandidate(POLL_ID, name)
        .accounts({
          signer: provider.wallet.publicKey,
          pollAccount: pollPda,
          candidateAccount: candidatePda(name),
        })
        .rpc();

      const account = await program.account.candidateAccount.fetch(candidatePda(name));
      assert.equal(account.candidateName, name);
      assert.ok(account.candidateVotes.eqn(0));
    });
  }

  // ── 3. Poll option index increments correctly ────────────────────────────────
  it("poll option index equals number of candidates", async () => {
    const poll = await program.account.pollAccount.fetch(pollPda);
    assert.ok(poll.pollOptionIndex.eqn(candidates.length));
  });

  // ── 4. Vote ─────────────────────────────────────────────────────────────────
  it("casts a vote for React", async () => {
    await program.methods
      .vote(POLL_ID, "React")
      .accounts({
        signer: provider.wallet.publicKey,
        pollAccount: pollPda,
        candidateAccount: candidatePda("React"),
      })
      .rpc();

    const account = await program.account.candidateAccount.fetch(candidatePda("React"));
    assert.ok(account.candidateVotes.eqn(1));
  });

  it("casts two more votes for Vue", async () => {
    for (let i = 0; i < 2; i++) {
      await program.methods
        .vote(POLL_ID, "Vue")
        .accounts({
          signer: provider.wallet.publicKey,
          pollAccount: pollPda,
          candidateAccount: candidatePda("Vue"),
        })
        .rpc();
    }
    const account = await program.account.candidateAccount.fetch(candidatePda("Vue"));
    assert.ok(account.candidateVotes.eqn(2));
  });

  // ── 5. Expired poll rejects votes ────────────────────────────────────────────
  it("rejects vote on an expired poll", async () => {
    const EXPIRED_ID = new BN(99);
    const pastStart = new BN(now - 7200);
    const pastEnd = new BN(now - 3600);

    const [expiredPollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), EXPIRED_ID.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [expiredCandPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), EXPIRED_ID.toArrayLike(Buffer, "le", 8), Buffer.from("Alpha")],
      program.programId
    );

    await program.methods
      .initializePoll(EXPIRED_ID, "Old Poll", "Already done", pastStart, pastEnd)
      .accounts({ signer: provider.wallet.publicKey, pollAccount: expiredPollPda })
      .rpc();

    await program.methods
      .initializeCandidate(EXPIRED_ID, "Alpha")
      .accounts({
        signer: provider.wallet.publicKey,
        pollAccount: expiredPollPda,
        candidateAccount: expiredCandPda,
      })
      .rpc();

    try {
      await program.methods
        .vote(EXPIRED_ID, "Alpha")
        .accounts({
          signer: provider.wallet.publicKey,
          pollAccount: expiredPollPda,
          candidateAccount: expiredCandPda,
        })
        .rpc();
      assert.fail("Should have thrown VotingEnded");
    } catch (err: any) {
      expect(err.message).to.include("VotingEnded");
    }
  });

  // ── 6. Future poll rejects votes ─────────────────────────────────────────────
  it("rejects vote on a poll that hasn't started", async () => {
    const FUTURE_ID = new BN(100);
    const futureStart = new BN(now + 7200);
    const futureEnd = new BN(now + 14400);

    const [futurePollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), FUTURE_ID.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [futureCandPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("candidate"), FUTURE_ID.toArrayLike(Buffer, "le", 8), Buffer.from("Beta")],
      program.programId
    );

    await program.methods
      .initializePoll(FUTURE_ID, "Future Poll", "Not yet open", futureStart, futureEnd)
      .accounts({ signer: provider.wallet.publicKey, pollAccount: futurePollPda })
      .rpc();

    await program.methods
      .initializeCandidate(FUTURE_ID, "Beta")
      .accounts({
        signer: provider.wallet.publicKey,
        pollAccount: futurePollPda,
        candidateAccount: futureCandPda,
      })
      .rpc();

    try {
      await program.methods
        .vote(FUTURE_ID, "Beta")
        .accounts({
          signer: provider.wallet.publicKey,
          pollAccount: futurePollPda,
          candidateAccount: futureCandPda,
        })
        .rpc();
      assert.fail("Should have thrown VotingNotStarted");
    } catch (err: any) {
      expect(err.message).to.include("VotingNotStarted");
    }
  });

  // ── 7. Invalid dates rejected ────────────────────────────────────────────────
  it("rejects poll with end before start", async () => {
    const BAD_ID = new BN(200);
    const [badPollPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), BAD_ID.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    try {
      await program.methods
        .initializePoll(BAD_ID, "Bad Poll", "Bad dates", END, START)
        .accounts({ signer: provider.wallet.publicKey, pollAccount: badPollPda })
        .rpc();
      assert.fail("Should have thrown InvalidDates");
    } catch (err: any) {
      expect(err.message).to.include("InvalidDates");
    }
  });
});
