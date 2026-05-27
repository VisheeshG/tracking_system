/*
  # Fix Project Passwords RLS
  
  1. Fix: Ensure project owners can insert into project_passwords with WITH CHECK clause
  2. Fix: Consolidate management policies
*/

-- Remove the restrictive policy
DROP POLICY IF EXISTS "Owners can manage project passwords" ON project_passwords;

-- Policy for viewing passwords
CREATE POLICY "Owners can view project passwords"
  ON project_passwords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy for creating passwords (INSERT needs WITH CHECK)
CREATE POLICY "Owners can create project passwords"
  ON project_passwords FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy for deleting passwords
CREATE POLICY "Owners can delete project passwords"
  ON project_passwords FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );
