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
   ```

4. **Set up Supabase database**

   - Create a new Supabase project
   - Run the migration file: `supabase/migrations/20241001000000_initial_schema.sql`
   - This will create all necessary tables and policies

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)


