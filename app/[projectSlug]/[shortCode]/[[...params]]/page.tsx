"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getDeviceType,
  getBrowser,
  getOS,
  getLocationData,
} from "@/lib/analytics";

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectSlug = params.projectSlug as string;
  const shortCode = params.shortCode as string;

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setLoading(true);
        setError(null);

        // URL structure: /{projectSlug}/{shortCode}/{creator}/{submission}
        // The shortCode is shared across all links in a project
        // The submission number identifies which specific link to redirect to
        const additionalParams = (params.params as string[]) || [];
        const creatorUsername = additionalParams[0] || null;
        const submissionNumber = additionalParams[1] || null;

        console.log("URL params:", {
          projectSlug,
          shortCode,
          creatorUsername,
          submissionNumber,
        });

        // Query the database to find the link
        // First, get the project by slug
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", projectSlug)
          .single();

        if (projectError || !projectData) {
          console.error("Project query error:", projectError);
          console.error("Project data:", projectData);
          console.error("Project slug:", projectSlug);
          setError("Project not found");
          return;
        }

        // Then, get the link by submission_number and project_id
        // The submission number uniquely identifies which link to redirect to
        const { data: linkData, error: linkError } = await supabase
          .from("links")
          .select(
            "id, destination_url, short_code, project_id, title, submission_number"
          )
          .eq("submission_number", submissionNumber)
          .eq("project_id", projectData.id)
          .single();

        if (linkError || !linkData) {
          console.error("Link query error:", linkError);
          console.error("Link data:", linkData);
          console.error("Query params:", {
            shortCode,
            projectSlug,
            projectId: projectData.id,
          });
          setError("Link not found");
          return;
        }

        // Get device and browser information
        const userAgent = navigator.userAgent;
        const deviceType = getDeviceType(userAgent);
        const browser = getBrowser(userAgent);
        const os = getOS(userAgent);

        // Get location data
        const locationData = await getLocationData();

        // Log analytics data for debugging
        const timestamp = new Date().toISOString();
        console.log("Analytics data:", {
          deviceType,
          browser,
          os,
          country: locationData.country,
          city: locationData.city,
          timestamp,
        });

        // Record the click with all analytics data
        const { error: clickError } = await supabase
          .from("link_clicks")
          .insert({
            link_id: linkData.id,
            platform_name: linkData.title, // Use the link title as platform name
            creator_username: creatorUsername,
            submission_number: submissionNumber,
            user_agent: userAgent,
            referrer: document.referrer || null,
            country: locationData.country,
            city: locationData.city,
            device_type: deviceType,
            browser: browser,
            os: os,
            clicked_at: timestamp,
          });

        if (clickError) {
          console.error("Error recording click:", clickError);
          // Don't block the redirect if click recording fails
        } else {
          console.log("Click recorded successfully with analytics data");
        }

        // Redirect to the destination URL
        window.location.href = linkData.destination_url;
      } catch (err) {
        console.error("Error handling redirect:", err);
        setError("An error occurred while processing the link");
      } finally {
        setLoading(false);
      }
    };

    handleRedirect();
  }, [projectSlug, shortCode, params.params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link Not Found
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          {/* <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button> */}
        </div>
      </div>
    );
  }

  return null;
}
