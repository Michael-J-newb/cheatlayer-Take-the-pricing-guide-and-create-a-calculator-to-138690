-- ============================================================
-- Nextdoor lead dedup, stale-lead management, and bulk dismiss
-- Applied to: cleaner-bees-nextdoor-agent (gjmcxedcwmggglpeodtn)
--
-- The real schema (leads, messages, runs, settings, keywords)
-- was created outside of Supabase migrations. This file tracks
-- only the improvements added on top of that baseline.
-- ============================================================

-- ============================================================
-- 1. Disposition protection trigger
--    Prevents the agent's periodic re-ingest (lookback_days: 7)
--    from resetting a disposition back to NULL via ON CONFLICT
--    DO UPDATE. Once a disposition is set, it stays set.
-- ============================================================
CREATE OR REPLACE FUNCTION protect_lead_disposition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.disposition IS NOT NULL AND NEW.disposition IS NULL THEN
    NEW.disposition := OLD.disposition;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_protect_disposition
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION protect_lead_disposition();

-- ============================================================
-- 2. Person-level dedup column
--    profile_url is never populated by the agent, so name_key
--    (normalised name) is the only way to identify repeat posters.
-- ============================================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS name_key text
    GENERATED ALWAYS AS (lower(trim(name))) STORED;

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_new
  ON leads (created_at DESC)
  WHERE disposition IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_actioned
  ON leads (created_at DESC)
  WHERE disposition IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_name_key
  ON leads (name_key)
  WHERE name_key IS NOT NULL;

-- ============================================================
-- 4. Utility view: new leads flagged when the same poster has
--    already been actioned on a different post.
-- ============================================================
CREATE OR REPLACE VIEW new_leads_with_prior_contact AS
SELECT
  l.*,
  EXISTS (
    SELECT 1 FROM leads prev
    WHERE prev.name_key    = l.name_key
      AND prev.id         != l.id
      AND prev.disposition IS NOT NULL
  ) AS person_previously_actioned
FROM leads l
WHERE l.disposition IS NULL
  AND l.not_relevant = false;

-- ============================================================
-- 5. Stale threshold — 7 days matches business reality
--    (most leads are dead after a week)
-- ============================================================
INSERT INTO settings (key, value) VALUES ('stale_lead_days', '7')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- 6. Auto-dismiss stale leads
--    Reads stale_lead_days from settings; defaults to 7.
--    'missed_window' is semantically correct for stale leads.
--    Called by the agent at the start of each run.
-- ============================================================
CREATE OR REPLACE FUNCTION auto_dismiss_stale_leads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stale_days integer;
  affected   integer;
BEGIN
  SELECT COALESCE(value::integer, 7) INTO stale_days
  FROM settings WHERE key = 'stale_lead_days';

  UPDATE leads
  SET disposition = 'missed_window'
  WHERE disposition IS NULL
    AND created_at < NOW() - (stale_days || ' days')::interval;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ============================================================
-- 7. Hard-delete leads older than 30 days
--    Respects the 30-day history window; reclaims disk space.
--    Called by the agent at the start of each run.
-- ============================================================
CREATE OR REPLACE FUNCTION purge_old_leads()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected integer;
BEGIN
  DELETE FROM leads WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- ============================================================
-- 8. Bulk dismiss by UUID array
--    Sets disposition = 'dismissed' — a quick-remove signal
--    distinct from the outcome-specific values (missed_window,
--    not_a_fit, etc.) that require deliberate categorisation.
--    Only affects leads currently in the new queue.
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_dismiss_leads(lead_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE leads
  SET disposition = 'dismissed'
  WHERE id = ANY(lead_ids)
    AND disposition IS NULL;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
