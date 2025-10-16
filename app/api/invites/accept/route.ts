import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    let { token } = body;
    if (typeof token === "string") token = token.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    console.log("Looking up invite token:", token);
    const { data: invite, error: fetchError } = await supabase
      .from("organization_invites")
      .select(
        "id, organization_id, token, expires_at, max_uses, uses, created_by, created_at"
      )
      .eq("token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching invite (query error):", fetchError);
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    if (!invite) {
      console.warn("Invite not found for token:", token);
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    // token expiry
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }

    // max user
    if (invite.max_uses && invite.uses >= invite.max_uses) {
      return NextResponse.json(
        { error: "This invite has reached its maximum uses" },
        { status: 400 }
      );
    }

    // already member ?
    const { data: existingMember, error: existingMemberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", invite.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMemberError) {
      console.error("Error checking existing membership:", existingMemberError);
      return NextResponse.json(
        { error: "Failed to verify membership" },
        { status: 500 }
      );
    }

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 400 }
      );
    }

    // add user to organization
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Failed to join organization" },
        { status: 500 }
      );
    }

    // increase uses
    if (invite.max_uses != null) {
      const { data: updated, error: updateError } = await supabase
        .from("organization_invites")
        .update({ uses: invite.uses + 1 })
        .eq("id", invite.id)
        .select();

      if (updateError) {
        console.error("Error updating invite uses:", updateError);
      }

      if (!updated) {
        return NextResponse.json(
          { error: "This invite has reached its maximum uses" },
          { status: 400 }
        );
      }
    } else {
      console.log("Incrementing invite uses for unlimited use invite");
      const { error: updateError } = await supabase
        .from("organization_invites")
        .update({ uses: invite.uses + 1 })
        .eq("id", invite.id)
        .select();

      if (updateError) {
        console.error("Error updating invite uses:", updateError);
      }
    }

    // org name to response
    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", invite.organization_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      organization: organization || { id: invite.organization_id },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
