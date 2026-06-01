import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  handleTrackingRedirect,
  resolveLinkByBrandProjectAndShortCode,
} from "@/lib/tracking-redirect";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Brand URL: /{brandSlug}/{projectSlug}/{shortCode}/{creator}[/sub1] */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      brandSlug: string;
      projectSlug: string;
      shortCode: string;
      params?: string[];
    }>;
  }
) {
  try {
    const resolvedParams = await params;
    const { brandSlug, projectSlug, shortCode } = resolvedParams;
    const additionalParams = resolvedParams.params || [];

    const linkData = await resolveLinkByBrandProjectAndShortCode(
      supabase,
      brandSlug,
      projectSlug,
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
    console.error("Brand redirect error:", error);
    return NextResponse.redirect("about:blank", 307);
  }
}
