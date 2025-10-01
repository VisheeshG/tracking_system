# Link Tracking System

A comprehensive link tracking platform built with Next.js and Supabase that enables brands to track campaign performance, creator engagement, and detailed traffic analytics.

## 🚀 Features

### 1. **Project Management**

- Create multiple projects for different apps or campaigns
- Each project has a unique slug and can contain multiple tracking links
- Organize your marketing campaigns efficiently

### 2. **Link Tracking**

- Add multiple trackable links per project
- Generate short URLs for easy sharing
- Track links with customizable parameters:
  - **Platform Name** (e.g., "goc" for Game of Creators)
  - **Creator Username** (e.g., "john_doe")
  - **Submission Number** (e.g., "sub1", "sub2")

### 3. **Advanced Analytics**

Track comprehensive metrics for each link:

- **Total Clicks** - Number of times the link was accessed
- **Geographic Location** - Country and city of visitors
- **Device Type** - Mobile, tablet, or desktop
- **Browser** - Chrome, Safari, Firefox, Edge, etc.
- **Operating System** - Windows, macOS, Linux, Android, iOS
- **Referrer** - Source of traffic

### 4. **Creator Performance Tracking**

- View clicks by platform (e.g., different social media platforms)
- Track individual creator performance
- Analyze submission-level data (multiple submissions per creator)

### 5. **Brand Dashboard**

- Overview of all projects and their performance
- Detailed analytics per project and per link
- Real-time click tracking
- Visual data representation with charts and graphs

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

## 🎯 How to Use

### Creating a Project

1. Sign up or log in to your account
2. Click "New Project" on the dashboard
3. Fill in:
   - **Project Name** (e.g., "Website Campaign")
   - **Project Slug** (auto-generated, used in URLs)
   - **Description** (optional)
4. Click "Create Project"

### Adding Links to a Project

1. Select a project from your dashboard
2. Click "New Link"
3. Fill in:
   - **Link Title** (e.g., "Instagram Profile")
   - **Destination URL** (where users will be redirected)
   - **Short Code** (auto-generated, used in tracking URLs)
4. Click "Create Link"

### Tracking Link Format

Your tracking links follow this format:

```
https://yourdomain.com/{short_code}/{platform}/{creator}/{submission}
```

**Examples:**

Basic link (no tracking parameters):

```
https://yourdomain.com/instagram
```

With platform tracking:

```
https://yourdomain.com/instagram/goc
```

With platform and creator:

```
https://yourdomain.com/instagram/goc/johndoe
```

Full tracking URL:

```
https://yourdomain.com/instagram/goc/johndoe/sub1
```

### Real-World Example

**Scenario:** You're running a campaign on "Game of Creators" platform with multiple creators.

1. **Create Project:** "Summer Campaign 2025"
2. **Add Links:**

   - Instagram: `instagram-profile`
   - YouTube: `youtube-channel`
   - Website: `brand-website`

3. **Distribute Links to Creators:**

   - John Doe's Instagram link: `/instagram-profile/goc/johndoe/sub1`
   - Jane Smith's Instagram link: `/instagram-profile/goc/janesmith/sub1`
   - John Doe's YouTube link: `/youtube-channel/goc/johndoe/sub1`

4. **Track Performance:**
   - View clicks per creator
   - See which platform performs better
   - Analyze geographic distribution of traffic
   - Compare different submissions from the same creator

## 📊 Analytics Dashboard

The analytics page shows:

### Summary Cards

- Total Clicks
- Number of Platforms
- Number of Creators
- Device Types

### Detailed Breakdowns

- **Clicks by Platform** - See which platforms drive the most traffic
- **Clicks by Creator** - Identify top-performing creators
- **Clicks by Submission** - Track multiple submissions per creator
- **Clicks by Country** - Geographic distribution
- **Clicks by City** - City-level tracking
- **Clicks by Device** - Mobile vs Desktop usage
- **Clicks by Browser** - Browser preferences
- **Clicks by OS** - Operating system distribution

### Recent Clicks Table

View the most recent clicks with:

- Timestamp
- Platform
- Creator
- Submission
- Location (City, Country)
- Device
- Browser

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Icons:** Lucide React
- **Geolocation:** ipapi.co API (with Vercel geolocation fallback)

## 🔒 Security Features

- Row-level security (RLS) in Supabase
- Users can only view/edit their own projects and links
- Public access to active links for tracking
- Secure API endpoints for tracking

## 🌍 Geolocation Tracking

The system uses two methods for geolocation:

1. **Vercel Geolocation Headers** (when deployed on Vercel)

   - Automatic and fast
   - No external API calls needed

2. **ipapi.co API** (fallback)
   - Free tier: 1,000 requests/day
   - Used when not on Vercel or as fallback
   - Provides country and city data

## 📝 Database Schema

### Tables

- **profiles** - User profiles and account information
- **projects** - Project/campaign data
- **links** - Trackable links within projects
- **link_clicks** - Click tracking data with analytics

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The app will automatically use Vercel's geolocation features for better performance.

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📖 API Endpoints

### POST `/api/track`

Track a link click with analytics data.

**Request Body:**

```json
{
  "linkId": "uuid",
  "platformName": "goc",
  "creatorUsername": "johndoe",
  "submissionNumber": "sub1",
  "userAgent": "...",
  "referrer": "...",
  "deviceType": "mobile",
  "browser": "Chrome",
  "os": "Android"
}
```

**Response:**

```json
{
  "success": true
}
```

The API automatically captures:

- IP address from request headers
- Geographic location (country, city)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for brands and creators
