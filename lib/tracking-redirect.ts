import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  getClientIpFromRequest,
  isLoopbackIp,
} from "@/lib/analytics";
import {
  buildMobileAppRedirectHtml,
  resolveMobileAppRedirect,
} from "@/lib/mobile-app-redirect";
import { isValidSubmissionSegment } from "@/lib/slug-utils";

export type ResolvedLink = {
  id: string;
  destination_url: string;
  platform: string;
  submission_number: string | null;
  open_app_on_mobile?: boolean;
  include_submission_in_url?: boolean;
};

function getDeviceType(ua: string): string {
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function getBrowser(ua: string): string {
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

function getOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/ios|iphone|ipad/i.test(ua)) return "iOS";
  return "Other";
}

async function resolveLocation(ip: string | null): Promise<{
  ip: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
}> {
  let country: string | null = null;
  let state: string | null = null;
  let city: string | null = null;
  let resolvedIp = ip;

  try {
    const locationUrl =
      resolvedIp && !isLoopbackIp(resolvedIp)
        ? `http://ip-api.com/json/${resolvedIp}`
        : `http://ip-api.com/json`;

    const locationResponse = await fetch(locationUrl, {
      signal: AbortSignal.timeout(3000),
    });

    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      if (locationData.status === "success") {
        country = locationData.country || null;
        state = locationData.regionName || null;
        city = locationData.city || null;
        if (
          locationData.query &&
          (!resolvedIp || isLoopbackIp(resolvedIp))
        ) {
          resolvedIp = locationData.query;
        }
      } else {
        try {
          const fallbackUrl =
            resolvedIp && !isLoopbackIp(resolvedIp)
              ? `https://ipapi.co/${resolvedIp}/json/`
              : `https://ipapi.co/json/`;
          const fallbackResponse = await fetch(fallbackUrl, {
            signal: AbortSignal.timeout(3000),
          });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            country = fallbackData.country_name || null;
            state = fallbackData.region || null;
            city = fallbackData.city || null;
            if (
              fallbackData.ip &&
              (!resolvedIp || isLoopbackIp(resolvedIp))
            ) {
              resolvedIp = fallbackData.ip;
            }
          }
        } catch {
          // ignore fallback failure
        }
      }
    }
  } catch {
    // ignore location failure
  }

  return { ip: resolvedIp, country, state, city };
}

export function parseCreatorAndSubmission(
  additionalParams: string[],
  link: ResolvedLink
): { creatorUsername: string | null; submissionNumber: string | null; valid: boolean } {
  const creatorUsername = additionalParams[0] || null;
  const second = additionalParams[1];

  if (second !== undefined && second !== "") {
    if (!isValidSubmissionSegment(second)) {
      return { creatorUsername, submissionNumber: null, valid: false };
    }
    return {
      creatorUsername,
      submissionNumber: second,
      valid: true,
    };
  }

  return {
    creatorUsername,
    submissionNumber: link.submission_number,
    valid: true,
  };
}

export async function handleTrackingRedirect(
  request: NextRequest,
  supabase: SupabaseClient,
  link: ResolvedLink,
  additionalParams: string[]
): Promise<NextResponse> {
  const parsed = parseCreatorAndSubmission(additionalParams, link);
  if (!parsed.valid) {
    return NextResponse.redirect("about:blank", 307);
  }

  const userAgent = request.headers.get("user-agent") || "";
  let ip = getClientIpFromRequest(request);
  const deviceType = getDeviceType(userAgent);
  const browser = getBrowser(userAgent);
  const os = getOS(userAgent);

  const location = await resolveLocation(ip);
  ip = location.ip;

  const { error: trackError } = await supabase.from("link_clicks").insert({
    link_id: link.id,
    platform_name: link.platform,
    creator_username: parsed.creatorUsername,
    submission_number: parsed.submissionNumber,
    user_agent: userAgent,
    ip_address: ip,
    country: location.country,
    state: location.state,
    city: location.city,
    device_type: deviceType,
    browser,
    os,
    clicked_at: new Date().toISOString(),
  });

  if (trackError) {
    console.error("Tracking error:", trackError);
  }

  const isMobileDevice = deviceType === "mobile" || deviceType === "tablet";

  if (link.open_app_on_mobile && isMobileDevice) {
    const appTargets = resolveMobileAppRedirect(link.destination_url, os);
    if (appTargets && (appTargets.appUrl || appTargets.androidIntent)) {
      return new NextResponse(buildMobileAppRedirectHtml(appTargets), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
  }

  return NextResponse.redirect(link.destination_url, 307);
}

export async function resolveLinkByProjectAndShortCode(
  supabase: SupabaseClient,
  projectId: string,
  shortCode: string
): Promise<ResolvedLink | null> {
  const { data } = await supabase
    .from("links")
    .select(
      "id, destination_url, platform, submission_number, open_app_on_mobile, include_submission_in_url"
    )
    .eq("short_code", shortCode)
    .eq("project_id", projectId)
    .single();

  return data;
}

export async function resolveLinkByBrandProjectAndShortCode(
  supabase: SupabaseClient,
  brandSlug: string,
  projectSlug: string,
  shortCode: string
): Promise<ResolvedLink | null> {
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", brandSlug)
    .single();

  if (!brand) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", projectSlug)
    .eq("brand_id", brand.id)
    .single();

  if (!project) return null;

  return resolveLinkByProjectAndShortCode(supabase, project.id, shortCode);
}
