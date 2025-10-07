-- Allow public (anon) read-only access to projects for public pages by slug
-- This enables viewing a project's basic info without authentication.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Keep existing authenticated-only policies intact; add an anon SELECT policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'projects' AND policyname = 'Anyone can view projects by slug'
  ) THEN
    CREATE POLICY "Anyone can view projects by slug"
      ON projects FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;


