import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  handleTrackingRedirect,
  resolveLinkByBrandProjectAndShortCode,
  resolveLinkByProjectAndShortCode,
} from "@/lib/tracking-redirect";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Tracking redirects (single dynamic tree to satisfy Next.js segment naming):
 * - Branded: /{brandSlug}/{projectSlug}/{shortCode}/{creator}[/sub1]
 * - Legacy:  /{projectSlug}/{shortCode}/{creator}[/sub1]
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      projectSlug: string;
      path: string[];
    }>;
  }
) {
  try {
    const { projectSlug: firstSegment, path } = await params;

    if (path.length >= 3) {
      const brandSlug = firstSegment;
      const nestedProjectSlug = path[0];
      const shortCode = path[1];
      const additionalParams = path.slice(2);

      const brandedLink = await resolveLinkByBrandProjectAndShortCode(
        supabase,
        brandSlug,
        nestedProjectSlug,
        shortCode
      );

      if (brandedLink) {
        return handleTrackingRedirect(
          request,
          supabase,
          brandedLink,
          additionalParams
        );
      }
    }

    const shortCode = path[0];
    const additionalParams = path.slice(1);

    const { data: projectData } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", firstSegment)
      .single();

    if (!projectData) {
      return NextResponse.redirect("about:blank", 307);
    }

    const linkData = await resolveLinkByProjectAndShortCode(
      supabase,
      projectData.id,
      shortCode
    );

    if (!linkData) {
      return NextResponse.redirect("about:blank", 307);
    }

    return handleTrackingRedirect(
      request,
      supabase,
      linkData,
      additionalParams
    );
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.redirect("about:blank", 307);
  }
}
