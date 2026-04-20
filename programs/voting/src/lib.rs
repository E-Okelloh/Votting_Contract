use anchor_lang::prelude::*;

declare_id!("BMg4Dniz8C6znDgyPjCQ1nQtsPMz2p8p8MK6HodNn6Vn");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        poll_name: String,
        poll_description: String,
        poll_voting_start: u64,
        poll_voting_end: u64,
    ) -> Result<()> {
        require!(poll_voting_end > poll_voting_start, VotingError::InvalidDates);
        require!(!poll_name.is_empty(), VotingError::EmptyName);

        let poll = &mut ctx.accounts.poll_account;
        poll.poll_id = poll_id;
        poll.poll_name = poll_name;
        poll.poll_description = poll_description;
        poll.poll_voting_start = poll_voting_start;
        poll.poll_voting_end = poll_voting_end;
        poll.poll_option_index = 0;
        Ok(())
    }

    pub fn initialize_candidate(
        ctx: Context<InitializeCandidate>,
        _poll_id: u64,
        candidate_name: String,
    ) -> Result<()> {
        require!(!candidate_name.is_empty(), VotingError::EmptyName);

        let poll = &mut ctx.accounts.poll_account;
        let candidate = &mut ctx.accounts.candidate_account;

        poll.poll_option_index += 1;
        candidate.candidate_name = candidate_name;
        candidate.candidate_votes = 0;
        Ok(())
    }

    pub fn vote(
        ctx: Context<CastVote>,
        _poll_id: u64,
        _candidate_name: String,
    ) -> Result<()> {
        let poll = &ctx.accounts.poll_account;
        let candidate = &mut ctx.accounts.candidate_account;

        let clock = Clock::get()?;
        let now = clock.unix_timestamp as u64;

        require!(now >= poll.poll_voting_start, VotingError::VotingNotStarted);
        require!(now <= poll.poll_voting_end, VotingError::VotingEnded);

        candidate.candidate_votes += 1;
        Ok(())
    }
}

// ── Contexts ──────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(poll_id: u64)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + PollAccount::INIT_SPACE,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll_account: Account<'info, PollAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll_account: Account<'info, PollAccount>,

    #[account(
        init,
        payer = signer,
        space = 8 + CandidateAccount::INIT_SPACE,
        seeds = [b"candidate", poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump,
    )]
    pub candidate_account: Account<'info, CandidateAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(poll_id: u64, candidate_name: String)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"poll", poll_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub poll_account: Account<'info, PollAccount>,

    #[account(
        mut,
        seeds = [b"candidate", poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump,
    )]
    pub candidate_account: Account<'info, CandidateAccount>,
}

// ── Accounts ──────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct PollAccount {
    pub poll_id: u64,
    #[max_len(32)]
    pub poll_name: String,
    #[max_len(208)]
    pub poll_description: String,
    pub poll_voting_start: u64,
    pub poll_voting_end: u64,
    pub poll_option_index: u64,
}

#[account]
#[derive(InitSpace)]
pub struct CandidateAccount {
    #[max_len(32)]
    pub candidate_name: String,
    pub candidate_votes: u64,
}

// ── Errors ────────────────────────────────────────────────────────────────────

#[error_code]
pub enum VotingError {
    #[msg("Voting has not started yet")]
    VotingNotStarted,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Voting end must be after start")]
    InvalidDates,
    #[msg("Name cannot be empty")]
    EmptyName,
}
