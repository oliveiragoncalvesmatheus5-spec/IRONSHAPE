-- Migration: Add nutrition_preferences column to profiles table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS nutrition_preferences jsonb DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'nutrition_preferences';
