/*
  # Add DELETE Policy for link_clicks Table
  
  ## Problem
  The link_clicks table has RLS enabled but no DELETE policy.
  This prevents users from deleting click data for their own links,
  which blocks cascade deletion when deleting projects or links.
  
  ## Solution
  Add a DELETE policy that allows users to delete click data
  for links that belong to their projects.
*/

-- Allow users to delete clicks for their own project links
CREATE POLICY "Users can delete clicks on own links"
  ON link_clicks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM links
      JOIN projects ON projects.id = links.project_id
      WHERE links.id = link_clicks.link_id
      AND projects.user_id = auth.uid()
    )
  );

