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

    console.log("Sending invite email (server):", {
      to: email,
      from: user.email,
      subject: `Invitation to join ${organizationName}`,
      inviteLink,
    });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping real send");
      return NextResponse.json({
        success: true,
        message:
          "Email sending not configured on server (RESEND_API_KEY missing)",
      });
    }

    // Use a verified sender for Resend. Resend requires the `from` domain
    // to be verified. Prefer RESEND_FROM_EMAIL from env.
    const RESEND_FROM_EMAIL =
      process.env.RESEND_FROM_EMAIL || "no-reply@yourdomain.com";

    // Send via Resend REST API
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: email,
          subject: `Invitation to join ${organizationName}`,
          // Set Reply-To so recipients can reply to the inviter
          headers: { "Reply-To": user.email },
          html: `
            <div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
              <h2>You've been invited to join ${organizationName}</h2>
              <p>Click the link below to accept the invitation:</p>
              <p><a href="${inviteLink}">${inviteLink}</a></p>
              <p>This link will expire in 7 days.</p>
            </div>
          `,
        }),
      });

      const payload = await res.text();
      if (!res.ok) {
        console.error("Resend responded with error:", res.status, payload);
        return NextResponse.json(
          { error: "Failed to send invite email" },
          { status: 502 }
        );
      }

      console.log("Resend send response:", payload);
      return NextResponse.json({ success: true, message: "Email sent" });
    } catch (err) {
      console.error("Error calling Resend API:", err);
      return NextResponse.json(
        { error: "Failed to send invite email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending invite email:", error);
    return NextResponse.json(
      { error: "Failed to send invite email" },
      { status: 500 }
    );
  }
}
