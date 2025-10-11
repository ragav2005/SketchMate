"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Facebook } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
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
const GoogleIcon = ({ className }: { className?: string }) => (
  <Image
    className={className}
    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEiklEQVR4nO2aW4iVVRTHf5bNHCma1MrsQuNIlN2EoBtTL91UpLSHSC0JBrUIpahEo8YeepG0CLpg14fKh3oK0kKFihJ70CnqJbVGSMx6mDKidDSdEwv+HyzOnP3dzj7nTOEfNgx866y917fWt9Z/rT1wEv9vTALmA+uAzcBu4HfgKHBMf+8FPgbWS3YyYwQVYDGwFTgBVAuuf4At0tHZDgMmAI8DB92hjgCfAv162zOAicBpwHj9fQUwD3gW+AI47n5/EFipl9MSzAUG3QF2AkuArhK6zgUeAfY4ffu0R9Ngb2qD23AXcHsk3acAi2REov8NeT4qzgMGtMHfwHLg1NibAKcDr9V4+/xYyqcBP0rx94rzZuNO4A/tuR84K4YnEiN2KMW2An0uC66K8U0MOCPM7UVg8d0D9AI3AZfmjPk+Z8RqImCDC6e8npih9LsrUDeOKe3aAc9phRFz3Yd9Zc7vaGNNUTyiNL0d+FIpdtg9Pwy85OK/L7YRE1ydWJFD/mHRkMRw8+QsoCOge5ZS67ArhC/ENsLwhBQOZKRYq9avSnZEh7ugwD4XAu/UhN5qIqHiaMcdGbKvOC/c08CeC4E/YxphuN8VoqxwSoy4PsK+RlWiYpsOaNwp7cMeVjgtYAxiktjocAYB3Oi40JjEfB3QqHhanTihkCryYbcU62WIFbQQ+iVjKTYvBpu01oU23KxD3pVyqIGcGc2j2qT1dWjDvRKw8CFQzEZUsTtKGNITad3smMG4ehv+JoEQr5qu58aGKWFILJzhdFr7PAoJzQi97V49N+7UTkOQN6p6uf9pQ36RTmsNRmFID0Ozph49t4zRbkP+ks5L2vGxx0KH01mvp2GTHtrcKYSkYZpdYOOqa1mLrO6AvinSd1zTl2BBXJNyqKdLFMQyNeJoCk26Jit7JhTls5RDXVaCoqwtsPboDB+k6OuTzIchgYmONKaNX96ToreIi6l6QdWMwV8y97LoCGKLhJamyHQ7Gm9NUSy8nyMicNPIG9OE7nPj0DQ85BqrG2gcSaNmL2hmitxMyQ2p1U5tdX+WsA0J0vCyM+ZeymOpGzwsyZB9XnLWZmfiMccus4YPiTEWZm9roJAXZwNvukzVnyF/pi6LTPbaPBtU3JjURv7kCLNktGMc6HVgTuDixoy/DngROOQ8muUJw5M5Gr9RmOMOdlUO+YuBd+sM6PaJm30OfOfIXuLFTaI+WbhIkxb73S0URDLu2V3grs9I3FOawozUKXRm6LcayIWoUC3GuabPMlthVHQgU/BViSF2p1J1r5qhy0veaq1xmcroSSnYD39wxrT6FnaxPGuXprc1qmyaM8YoxNW0BivcN2cJJQqmuDA7rGyWWpAaQJebCRtlWhZ7g4pLALa+UXaLhfHAA8BP0n9IRLZpmO1CraoR0YOhQUAOdOvOftDp3FqwuDbknUeBAzU9hNWLZ4C7dWk6WR1dp7q56bqGWybv1t5s7dRcre6Yp5no1P34JzX/xVBkDWmOfCtjBF26Vn4O+Eh3j0PylFX5X5X1dujgy+WdZiWNk6Bd+Bd0e95vnQAYggAAAABJRU5ErkJggg=="
    alt="google-logo--v1"
    width={16}
    height={16}
    unoptimized
  />
);
