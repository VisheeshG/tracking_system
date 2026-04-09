/*
  # Fix Projects RLS and Uniqueness Checks
  
  1. Fix: Allow authenticated users to view all project slugs (previously only anon could)
  2. Fix: Ensure INSERT policy is robust
*/

-- Update the public view policy to include authenticated users
-- This ensures thatiqueness checks work correctly for logged-in users 
-- trying to create new projects.
DROP POLICY IF EXISTS "Anyone can view projects by slug" ON projects;

CREATE POLICY "Anyone can view project basic info"
  ON projects FOR SELECT
  TO public
  USING (true);

-- Re-verify the INSERT policy
DROP POLICY IF EXISTS "Users can create own projects" ON projects;

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
