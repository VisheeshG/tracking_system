/** Central brand + SEO config (single source of truth). */
export const siteConfig = {
  name: "Linkto",
  tagline: "Branded links. Creator-level clarity.",
  description:
    "Linkto is a creator-focused link tracking platform for brands, agencies, and marketers. Track every creator-driven click with branded URLs, campaign analytics, geo insights, and client-ready reports.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://linkto.in",
  keywords: [
    "link tracking",
    "creator analytics",
    "influencer marketing",
    "branded links",
    "campaign analytics",
    "UTM alternative",
    "creator attribution",
    "agency reporting",
    "linkto",
  ],
} as const;

export const defaultTitle = `${siteConfig.name} — ${siteConfig.tagline}`;
