-- Add login_streak column to track consecutive daily logins
ALTER TABLE user_rewards 
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN user_rewards.login_streak IS 'Number of consecutive days the user has claimed daily login rewards';
