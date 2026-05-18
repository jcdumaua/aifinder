import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: submissions, error: submissionsError } = await supabaseAdmin
    .from("submitted_tools")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (submissionsError) {
    return NextResponse.json(
      { error: submissionsError.message },
      { status: 500 }
    );
  }

  const { count: totalTools, error: totalToolsError } = await supabaseAdmin
    .from("tools")
    .select("*", { count: "exact", head: true });

  const { count: pendingSubmissions, error: pendingError } =
    await supabaseAdmin
      .from("submitted_tools")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

  const { count: approvedSubmissions, error: approvedError } =
    await supabaseAdmin
      .from("submitted_tools")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

  const { count: rejectedSubmissions, error: rejectedError } =
    await supabaseAdmin
      .from("submitted_tools")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected");

  const statsError =
    totalToolsError || pendingError || approvedError || rejectedError;

  if (statsError) {
    return NextResponse.json(
      { error: statsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    submissions,
    stats: {
      totalTools: totalTools || 0,
      pendingSubmissions: pendingSubmissions || 0,
      approvedSubmissions: approvedSubmissions || 0,
      rejectedSubmissions: rejectedSubmissions || 0,
    },
  });
}

export async function POST(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const submissionId = body.submissionId;

  if (!submissionId) {
    return NextResponse.json(
      { error: "Missing submission ID" },
      { status: 400 }
    );
  }

  const { data: submission, error: fetchError } = await supabaseAdmin
    .from("submitted_tools")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json(
      { error: fetchError?.message || "Submission not found" },
      { status: 404 }
    );
  }

  const { error: insertError } = await supabaseAdmin.from("tools").insert([
    {
      name: submission.name,
      category: submission.category,
      description: submission.description,
      website: submission.website,
      pricing: submission.pricing || "Free + Paid",
      platforms: [],
      featured: false,
      best_for: "General use",
      use_cases: [],
    },
  ]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("submitted_tools")
    .update({ status: "approved" })
    .eq("id", submissionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Submission approved and added to tools.",
  });
}

export async function PUT(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Missing submission ID" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("submitted_tools")
    .update({
      name: body.name,
      category: body.category,
      description: body.description,
      website: body.website,
      pricing: body.pricing,
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Submission updated.",
  });
}

export async function PATCH(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const submissionId = body.submissionId;

  if (!submissionId) {
    return NextResponse.json(
      { error: "Missing submission ID" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("submitted_tools")
    .update({ status: "rejected" })
    .eq("id", submissionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Submission rejected.",
  });
}