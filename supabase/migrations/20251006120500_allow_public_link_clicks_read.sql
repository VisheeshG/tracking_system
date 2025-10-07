-- Allow anonymous users to read link_clicks for public analytics pages
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'link_clicks' AND policyname = 'Anyone can view link clicks'
  ) THEN
    CREATE POLICY "Anyone can view link clicks"
      ON link_clicks FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;


