"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Facebook } from "lucide-react";

export default function LoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the magic link!");
      setEmail("");
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setOauthLoading(null);
    }
  };

  useEffect(() => {
    if (hasShownToast.current) return;

    const error = searchParams.get("error");
    if (error) {
      hasShownToast.current = true;
      setTimeout(() => {
        toast.error(error);
      }, 100);
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-lg border">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-base flex items-center cursor-pointer"
            onClick={() => handleOAuthLogin("google")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "google" ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon className="w-4 h-4 mr-2" />
            )}
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-base flex items-center cursor-pointer"
            onClick={() => handleOAuthLogin("facebook")}
            disabled={oauthLoading !== null}
          >
            {oauthLoading === "facebook" ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Facebook className="w-5 h-5 mr-1" />
            )}
            Continue with Facebook
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-card text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Magic Link Form */}
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
              className="mt-1.5 w-full h-11 px-4 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base flex items-center cursor-pointer"
            disabled={loading || oauthLoading !== null}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-4 mr-1" />
                Send Link
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
