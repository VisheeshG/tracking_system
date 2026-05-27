// Analytics utility functions for device and browser detection

const LOOPBACK_IPS = new Set(["::1", "127.0.0.1", "localhost"]);

export function isLoopbackIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const normalized = ip.trim().toLowerCase();
  return (
    LOOPBACK_IPS.has(normalized) ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("127.")
  );
}

export function getClientIpFromRequest(request: Request): string | null {
  const headerCandidates = [
    request.headers.get("x-forwarded-for")?.split(",")[0],
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0],
    request.headers.get("true-client-ip"),
  ];

  for (const value of headerCandidates) {
    const ip = value?.trim();
    if (ip) return ip;
  }

  return null;
}

export function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) {
      return "tablet";
    }
    return "mobile";
  }

  return "desktop";
}

export function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes("chrome") && !ua.includes("edg")) {
    return "Chrome";
  } else if (ua.includes("firefox")) {
    return "Firefox";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    return "Safari";
  } else if (ua.includes("edg")) {
    return "Edge";
  } else if (ua.includes("opera") || ua.includes("opr")) {
    return "Opera";
  } else {
    return "Unknown";
  }
}

export function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes("windows")) {
    return "Windows";
  } else if (ua.includes("mac")) {
    return "macOS";
  } else if (ua.includes("linux")) {
    return "Linux";
  } else if (ua.includes("android")) {
    return "Android";
  } else if (
    ua.includes("ios") ||
    ua.includes("iphone") ||
    ua.includes("ipad")
  ) {
    return "iOS";
  } else {
    return "Unknown";
  }
}

export async function getLocationData(): Promise<{
  country: string | null;
  state: string | null;
  city: string | null;
}> {
  try {
    // Try to get location using a free IP geolocation service
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || null,
        state: data.region || null,
        city: data.city || null,
      };
    }
  } catch (error) {
    console.log("Failed to get location data:", error);
  }

  // Fallback: try another service
  try {
    const response = await fetch("https://ip-api.com/json/");
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country || null,
        state: data.regionName || null,
        city: data.city || null,
      };
    }
  } catch (error) {
    console.log("Failed to get location data from fallback service:", error);
  }

  return {
    country: null,
    state: null,
    city: null,
  };
}
