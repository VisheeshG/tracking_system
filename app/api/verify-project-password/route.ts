import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";

// Public API to verify a password for a project
// POST /api/verify-project-password
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await request.json();
    const { project_slug, password } = body;

    if (!project_slug || !password) {
      return NextResponse.json(
        { error: "project_slug and password are required" },
        { status: 400 }
      );
    }

    // Find the project by slug
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", project_slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all password hashes for this project
    // We need to use service role key to bypass RLS
    const supabaseServiceRole = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
    );

    const { data: passwords, error: passwordsError } = await supabaseServiceRole
      .from("project_passwords")
      .select("id, password_hash")
      .eq("project_id", project.id);

    if (passwordsError) {
      console.error("Error fetching passwords:", passwordsError);
      return NextResponse.json(
        { error: "Failed to verify password" },
        { status: 500 }
      );
    }

    if (!passwords || passwords.length === 0) {
      // No passwords set means project is not protected
      return NextResponse.json({ valid: true, hasPasswords: false });
    }

    // Check if the provided password matches any of the stored hashes
    let isValid = false;
    for (const pwd of passwords) {
      const match = await bcrypt.compare(password, pwd.password_hash);
      if (match) {
        isValid = true;
        break;
      }
    }

    if (isValid) {
      // Generate a simple access token (you might want to use JWT for production)
      const accessToken = Buffer.from(
        `${project.id}:${Date.now()}:${Math.random()}`
      ).toString("base64");

      return NextResponse.json({
        valid: true,
        hasPasswords: true,
        accessToken,
        projectId: project.id,
      });
    } else {
      return NextResponse.json(
        {
          valid: false,
          hasPasswords: true,
          error: "Invalid password",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/verify-project-password?project_slug=xxx - Check if project has passwords
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const searchParams = request.nextUrl.searchParams;
    const projectSlug = searchParams.get("project_slug");

    if (!projectSlug) {
      return NextResponse.json(
        { error: "project_slug is required" },
        { status: 400 }
      );
    }

    // Find the project by slug
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if project has any passwords (using service role to bypass RLS)
    const supabaseServiceRole = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
    );

    const { count, error: countError } = await supabaseServiceRole
      .from("project_passwords")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    if (countError) {
      console.error("Error checking passwords:", countError);
      return NextResponse.json(
        { error: "Failed to check password protection" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasPasswords: (count || 0) > 0,
      projectId: project.id,
    });
  } catch (error) {
    console.error("Error checking password protection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
