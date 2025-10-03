import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Link = {
  id: string;
  project_id: string;
  destination_url: string;
  short_code: string;
  title: string;
  submission_number: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkClick = {
  id: string;
  link_id: string;
  platform_name: string | null;
  creator_username: string | null;
  submission_number: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  clicked_at: string;
};
