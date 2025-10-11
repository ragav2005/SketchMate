"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Loader2, User } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      const { data, error } = await supabase.auth.getSession();

      const errorDescription = searchParams.get("error_description");

      if (error) {
        const errorMessage = errorDescription || error.message;
        setStatus("Authentication error: " + errorMessage);
        router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
        return;
      }

      if (data.session) {
        setStatus("Authentication successful! Checking profile...");

        const user = data.session.user;
        const isOAuthUser =
          user.app_metadata?.provider && user.app_metadata.provider !== "email";

        const hasName =
          user.user_metadata?.name || user.user_metadata?.full_name;

        if (!hasName && !isOAuthUser) {
          setStatus("Profile setup required. Redirecting...");
          router.push("/auth/complete-profile");
        } else if (!hasName && isOAuthUser) {
          setStatus("Profile setup required. Redirecting...");
          router.push("/auth/complete-profile");
        } else {
          setStatus("Authentication successful! Redirecting...");
          router.push("/");
        }
      } else {
        const errorMessage =
          errorDescription || "No session found. Please try logging in again.";
        setStatus(errorMessage);
        router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  const getStatusIcon = () => {
    if (status.includes("error") || status.includes("Error")) {
      return <XCircle className="w-8 h-8 text-destructive" />;
    } else if (status.includes("successful") || status.includes("created")) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    } else if (status.includes("Processing") || status.includes("Checking")) {
      return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
    } else if (status.includes("setup") || status.includes("required")) {
      return <User className="w-8 h-8 text-primary" />;
    }
    return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
  };

  const getStatusColor = () => {
    if (status.includes("error") || status.includes("Error")) {
      return "text-destructive";
    } else if (status.includes("successful") || status.includes("created")) {
      return "text-green-600";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-lg border">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {getStatusIcon()}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Authenticating
            </h1>
            <p className={`text-sm ${getStatusColor()}`}>{status}</p>
          </div>
        </div>

        {(status.includes("Processing") || status.includes("Checking")) && (
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Please wait while we verify your authentication...
            </p>
          </div>
        )}

        {(status.includes("successful") ||
          status.includes("error") ||
          status.includes("Error")) && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {status.includes("successful")
                ? "You will be redirected shortly..."
                : "Redirecting you back to login..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
