import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, maxUses, expiresInDays } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // invite user status
    const { data: orgMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    const { data: orgCreator } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", organizationId)
      .eq("created_by", user.id)
      .single();

    if (!orgMember && !orgCreator) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to invite members to this organization",
        },
        { status: 403 }
      );
    }

    // token
    const token = nanoid(32);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 1));

    // invite creation
    const { data: invite, error } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId,
        token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invite:", error);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
