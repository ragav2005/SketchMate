"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Validating invitation...");

  useEffect(() => {
    handleInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInvite = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const returnUrl = `/invite/${token}`;
        router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
        return;
      }

      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to accept invitation");
        return;
      }

      setStatus("success");
      setMessage(
        `Successfully joined ${data.organization?.name || "the organization"}!`
      );

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error accepting invite:", error);
      setStatus("error");
      setMessage("An unexpected error occurred");
    }
  };

  const getStatusIcon = () => {
    if (status === "error") {
      return <XCircle className="w-12 h-12 text-destructive" />;
    } else if (status === "success") {
      return <CheckCircle className="w-12 h-12 text-green-500" />;
    }
    return <Loader2 className="w-12 h-12 text-primary animate-spin" />;
  };

  const getStatusColor = () => {
    if (status === "error") {
      return "text-destructive";
    } else if (status === "success") {
      return "text-green-600 dark:text-green-400";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-lg border">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              {getStatusIcon()}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {status === "loading"
                ? "Processing Invitation"
                : status === "success"
                ? "Welcome!"
                : "Invitation Error"}
            </h1>
            <p className={`text-sm ${getStatusColor()}`}>{message}</p>
          </div>
        </div>

        {status === "loading" && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Please wait while we process your invitation...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You will be redirected to the dashboard shortly...
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              The invitation link may be invalid, expired, or already used.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
