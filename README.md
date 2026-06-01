# Link Tracking System

A comprehensive link tracking platform built with Next.js and Supabase that enables brands to track campaign performance, creator engagement, and detailed traffic analytics.


## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   The service role key is required for deleting projects (server-side cleanup of related data). Find it in Supabase Dashboard → Project Settings → API.

4. **Run database migrations**
   Apply migrations in `supabase/migrations/` to your Supabase project (including `20250601000000_add_brands.sql` for the brands folder feature).

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)


