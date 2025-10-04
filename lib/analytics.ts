// Analytics utility functions for device and browser detection

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
  city: string | null;
}> {
  try {
    // Try to get location using a free IP geolocation service
    const response = await fetch("https://ipapi.co/json/");
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || null,
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
        city: data.city || null,
      };
    }
  } catch (error) {
    console.log("Failed to get location data from fallback service:", error);
  }

  return {
    country: null,
    city: null,
  };
}
