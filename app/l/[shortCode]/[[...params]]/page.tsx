"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function LinkRedirectPage() {
  const params = useParams();
  const [status, setStatus] = useState<"loading" | "redirecting" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleRedirect = useCallback(async () => {
    try {
      const shortCode = params.shortCode as string;
      const urlParams = params.params as string[] | undefined;

      const creatorUsername = urlParams?.[0] || null;
      const submissionNumber = urlParams?.[1] || null;
      const platformName = shortCode; // Use short_code as platform

      if (!shortCode) {
        throw new Error("Invalid tracking URL");
      }

      const { data: link, error } = await supabase
        .from("links")
        .select("*")
        .eq("short_code", shortCode)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!link) {
        throw new Error("Link not found or inactive");
      }

      const userAgent = navigator.userAgent;
      const deviceType = /mobile/i.test(userAgent)
        ? "mobile"
        : /tablet/i.test(userAgent)
        ? "tablet"
        : "desktop";

      let browser = "unknown";
      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Safari")) browser = "Safari";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Edge")) browser = "Edge";

      let os = "unknown";
      if (userAgent.includes("Windows")) os = "Windows";
      else if (userAgent.includes("Mac")) os = "macOS";
      else if (userAgent.includes("Linux")) os = "Linux";
      else if (userAgent.includes("Android")) os = "Android";
      else if (userAgent.includes("iOS")) os = "iOS";

      // Best-effort geolocation lookup for country/city
      // Uses a public geolocation API with a short timeout to avoid delaying redirect
      let geoCountry: string | null = null;
      let geoCity: string | null = null;
      let ipAddress: string | null = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const geo = await res.json();
          geoCountry = geo?.country_name || geo?.country || null;
          geoCity = geo?.city || null;
          ipAddress = geo?.ip || null;
        }
      } catch {
        // Ignore geo errors; proceed without country
      }

      await supabase.from("link_clicks").insert({
        link_id: link.id,
        platform_name: platformName,
        creator_username: creatorUsername,
        submission_number: submissionNumber,
        user_agent: userAgent,
        referrer: document.referrer || null,
        device_type: deviceType,
        browser: browser,
        os: os,
        country: geoCountry,
        city: geoCity,
        ip_address: ipAddress,
      });

      setStatus("redirecting");
      window.location.href = link.destination_url;
    } catch (error: unknown) {
      console.error("Redirect error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  }, [params]);

  useEffect(() => {
    handleRedirect();
  }, [handleRedirect]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Link Not Found
          </h1>
          <p className="text-slate-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {status === "loading" ? "Loading..." : "Redirecting..."}
        </h1>
        <p className="text-slate-600">Please wait while we redirect you</p>
      </div>
    </div>
  );
}
