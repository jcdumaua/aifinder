import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name || !body.category || !body.description || !body.website) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("tools").insert([
    {
      name: body.name,
      category: body.category,
      description: body.description,
      website: body.website,
      pricing: body.pricing || null,
      logo_url: body.logo_url || null,
      platforms: [],
      featured: false,
      best_for: "General use",
      use_cases: [],
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Tool added.",
  });
}

export async function PUT(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing tool ID" }, { status: 400 });
  }

  if (!body.name || !body.category || !body.description || !body.website) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("tools")
    .update({
      name: body.name,
      category: body.category,
      description: body.description,
      website: body.website,
      pricing: body.pricing || null,
      logo_url: body.logo_url || null,
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Tool updated.",
  });
}

export async function DELETE(request: Request) {
  const adminPassword = request.headers.get("x-admin-password");

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing tool ID" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("tools")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Tool deleted.",
  });
}