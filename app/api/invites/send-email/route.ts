import { MailerooClient, EmailAddress } from "maileroo-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, inviteLink, organizationName } = await request.json();

    if (!email || !inviteLink || !organizationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = new MailerooClient(process.env.MAILEROO_API_KEY!);

    const referenceId = await client.sendTemplatedEmail({
      from: new EmailAddress(
        "sketchmate@ba6f1234f3fa9197.maileroo.org",
        "SketchMate"
      ),
      to: new EmailAddress(email, user.user_metadata.full_name || "User"),
      subject: "You have been invited to join an organization!",
      template_id: 3699,
      template_data: {
        user_name: user.user_metadata.full_name || "User",
        link: inviteLink,
        org_name: organizationName,
      },
    });

    console.log("Email sent with reference ID:", referenceId);
    return NextResponse.json({ success: true, referenceId });
  } catch (error) {
    console.error("Error sending invite email:", error);
    return NextResponse.json(
      { error: "Failed to send invite email" },
      { status: 500 }
    );
  }
}
