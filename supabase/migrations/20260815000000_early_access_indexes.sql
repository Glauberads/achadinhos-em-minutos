-- Forward-only index migration for Early Access FKs
-- Created: 2026-08-15
-- Purpose: Add dedicated indexes for foreign keys without dedicated indexes
-- Tech debt identified in EA-3.2 reconciliation

-- Index for invite_code_redemptions(invite_code_id)
-- FK: invite_code_redemptions_invite_fk -> invite_codes(id)
CREATE INDEX IF NOT EXISTS idx_invite_code_redemptions_invite_code_id
    ON public.invite_code_redemptions (invite_code_id);

-- Index for invite_codes(created_by)
-- FK: invite_codes_created_by_fkey -> profiles(id)
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by
    ON public.invite_codes (created_by);