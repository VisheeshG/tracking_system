/*
  # Project Passwords Schema
  
  ## Overview
  This migration creates a multi-password system for shared project links.
  Each project can have multiple passwords, allowing granular access control.
  
  ## New Table: project_passwords
  - `id` (uuid, primary key) - Unique password identifier
  - `project_id` (uuid, foreign key) - Associated project
  - `password_hash` (text) - Hashed password (using bcrypt/scrypt)
  - `description` (text, optional) - Note about this password (e.g., "For investor")
  - `created_at` (timestamptz) - When this password was created
  - `created_by` (uuid, foreign key) - User who created this password
  
  ## Security
  - Enable RLS on project_passwords table
  - Project owners can manage (CRUD) passwords for their projects
  - Anonymous users cannot view or modify passwords (they can only verify via API)
  - Passwords are stored as hashes, never plain text
  
  ## Access Flow
  1. User visits /{projectSlug}
  2. If project has passwords, prompt for password
  3. Password is verified via API (checks hash)
  4. If valid, grant access (store session/token)
  5. Project owner can create/delete passwords to grant/revoke access
*/

-- Create project_passwords table
CREATE TABLE IF NOT EXISTS project_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE project_passwords ENABLE ROW LEVEL SECURITY;

-- Project owners can view passwords for their own projects
CREATE POLICY "Project owners can view project passwords"
  ON project_passwords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can create passwords for their own projects
CREATE POLICY "Project owners can create project passwords"
  ON project_passwords FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can delete passwords for their own projects
CREATE POLICY "Project owners can delete project passwords"
  ON project_passwords FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Project owners can update password descriptions
CREATE POLICY "Project owners can update project passwords"
  ON project_passwords FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_passwords.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_passwords_project_id ON project_passwords(project_id);

-- Add a function to check if a project has any passwords
CREATE OR REPLACE FUNCTION project_has_passwords(project_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_passwords
    WHERE project_id = project_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

