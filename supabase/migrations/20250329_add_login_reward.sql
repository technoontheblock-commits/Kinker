-- Add last_login_reward column to track daily login bonuses
ALTER TABLE user_rewards 
ADD COLUMN IF NOT EXISTS last_login_reward TIMESTAMP WITH TIME ZONE;
