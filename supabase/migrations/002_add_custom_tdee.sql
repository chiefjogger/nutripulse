-- Add custom_tdee column to profiles for manual TDEE override
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_tdee numeric;

COMMENT ON COLUMN profiles.custom_tdee IS 'User-specified daily expenditure override. NULL = auto-calculated from activity level.';
