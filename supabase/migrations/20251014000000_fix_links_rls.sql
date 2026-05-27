/*
  # Fix Links RLS and Uniqueness Checks
  
  1. Fix: Allow anyone to view link basic info by short_code (for redirects and checks)
  2. Fix: Ensure INSERT policy for links is robust and correctly checks project ownership
*/

-- Update the view policy for links
-- Original policy was "Anyone can view all links" but only for 'anon'
DROP POLICY IF EXISTS "Anyone can view all links" ON links;
DROP POLICY IF EXISTS "Users can view own project links" ON links;

-- All users (logged in or not) can see the basic redirect info for any link
CREATE POLICY "Anyone can view link basic info"
  ON links FOR SELECT
  TO public
  USING (true);

-- Re-verify the INSERT policy
DROP POLICY IF EXISTS "Users can create links in own projects" ON links;

CREATE POLICY "Users can create links in own projects"
  ON links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = links.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Also add a policy for link_clicks if not already correct
-- We saw 403s previously on clicks sometimes
DROP POLICY IF EXISTS "Anyone can record link clicks" ON link_clicks;

CREATE POLICY "Anyone can record link clicks"
  ON link_clicks FOR INSERT
  TO public
  WITH CHECK (true);
