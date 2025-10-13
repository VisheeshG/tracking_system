import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to parse device type from user agent
function getDeviceType(ua: string): string {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

// Helper function to parse browser from user agent
function getBrowser(ua: string): string {
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

// Helper function to parse OS from user agent
function getOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/ios|iphone|ipad/i.test(ua)) return "iOS";
  return "Other";
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      projectSlug: string;
      shortCode: string;
      params?: string[];
    }>;
  }
) {
  try {
    const resolvedParams = await params;
    const projectSlug = resolvedParams.projectSlug;
    const shortCode = resolvedParams.shortCode;
    const additionalParams = resolvedParams.params || [];
    const creatorUsername = additionalParams[0] || null;
    // Use submission number from URL if provided, otherwise use from database
    const submissionNumberFromUrl = additionalParams[1] || null;

    // Validate submission number format if provided in URL
    // Must be in format: sub1, sub2, sub3, etc. (sub followed by any number)
    if (submissionNumberFromUrl) {
      const submissionPattern = /^sub\d+$/;
      if (!submissionPattern.test(submissionNumberFromUrl)) {
        // Invalid submission number format - don't redirect or track
        console.log(
          `Invalid submission number format: ${submissionNumberFromUrl}. Expected format: sub1, sub2, sub3, etc.`
        );
        return NextResponse.redirect("about:blank", 307);
      }
    }

    // Get project
    const { data: projectData } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .single();

    if (!projectData) {
      return NextResponse.redirect("about:blank", 307);
    }

    // Get link
    const { data: linkData } = await supabase
      .from("links")
      .select("id, destination_url, platform, submission_number")
      .eq("short_code", shortCode)
      .eq("project_id", projectData.id)
      .single();

    if (!linkData) {
      return NextResponse.redirect("about:blank", 307);
    }

    // Get server-side tracking info
    const userAgent = request.headers.get("user-agent") || "";

    // Get client IP address
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      null;

    // Parse user agent for device info
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Get location data from IP (server-side)
    let country = null;
    let city = null;

    console.log("=== LOCATION LOOKUP START ===");
    console.log("Raw IP from headers:", ip);
    console.log(
      "All request headers:",
      Object.fromEntries(request.headers.entries())
    );

    // Try to get location from IP address using ip-api.com (more reliable and higher free tier)
    try {
      // Use ip-api.com which has better free tier (45 requests/minute)
      const locationUrl =
        ip && ip !== "::1" && ip !== "127.0.0.1" && ip !== "localhost"
          ? `http://ip-api.com/json/${ip}`
          : `http://ip-api.com/json`; // Auto-detect from request

      console.log("Fetching location from:", locationUrl);

      const locationResponse = await fetch(locationUrl, {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });

      console.log("Location response status:", locationResponse.status);

      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        console.log(
          "Location data received:",
          JSON.stringify(locationData, null, 2)
        );

        // ip-api.com returns 'country' and 'city' directly
        if (locationData.status === "success") {
          country = locationData.country || null;
          city = locationData.city || null;
          console.log("✅ Location extracted successfully:", { country, city });
        } else {
          console.error("❌ ip-api.com returned error:", locationData.message);

          // Fallback to ipapi.co
          console.log("Trying fallback API: ipapi.co");
          try {
            const fallbackUrl =
              ip && ip !== "::1" && ip !== "127.0.0.1" && ip !== "localhost"
                ? `https://ipapi.co/${ip}/json/`
                : `https://ipapi.co/json/`;

            const fallbackResponse = await fetch(fallbackUrl, {
              signal: AbortSignal.timeout(3000),
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log(
                "Fallback data received:",
                JSON.stringify(fallbackData, null, 2)
              );
              country = fallbackData.country_name || null;
              city = fallbackData.city || null;
              console.log("✅ Fallback location extracted:", { country, city });
            }
          } catch (fallbackError) {
            console.error("Fallback API also failed:", fallbackError);
          }
        }
      } else {
        const errorText = await locationResponse.text();
        console.error("Location API HTTP error:", errorText);
      }
    } catch (error) {
      console.error("Location lookup error:", error);
    }

    console.log("Final location values:", { country, city });

    // Use submission number from URL if provided, otherwise use from database
    const submissionNumber =
      submissionNumberFromUrl || linkData.submission_number;

    // Record click with all tracking data including location
    console.log("Recording click with data:", {
      link_id: linkData.id,
      country,
      city,
      device_type: deviceType,
      submission_number: submissionNumber,
    });

    const { error: trackError } = await supabase.from("link_clicks").insert({
      link_id: linkData.id,
      platform_name: linkData.platform,
      creator_username: creatorUsername,
      submission_number: submissionNumber,
      user_agent: userAgent,
      country: country,
      city: city,
      device_type: deviceType,
      browser: browser,
      os: os,
      clicked_at: new Date().toISOString(),
    });

    if (trackError) {
      console.error("Tracking error:", trackError);
    } else {
      console.log("Click tracked successfully with location:", {
        country,
        city,
      });
    }

    // Now redirect after tracking is complete
    return NextResponse.redirect(linkData.destination_url, 307);
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.redirect("about:blank", 307);
  }
}
