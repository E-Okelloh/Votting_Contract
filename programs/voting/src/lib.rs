use anchor_lang::prelude::*;

declare_id!("BMg4Dniz8C6znDgyPjCQ1nQtsPMz2p8p8MK6HodNn6Vn");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    
    }
}

#[Account]
#[derive(InitSpace)]
pub struct PollAccount {
    #[max_len(32)]
    pub poll_name: String,
    #[max_len(208)]
    pub poll_description: String,
    pub poll_voting_start: u64,
    pub poll_voting_end: u64,
    pub poll_option_index: u64,

}

#[Account]
#[derive(InitSpace)]
pub struct CandidateAccount {
    pub candidate_name: String,
}

