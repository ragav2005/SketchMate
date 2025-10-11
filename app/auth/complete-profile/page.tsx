"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User } from "lucide-react";

export default function CompleteProfilePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/auth/login");
        return;
      }

      setUser(session.user);

      const hasName =
        session.user.user_metadata?.name ||
        session.user.user_metadata?.full_name;

      if (hasName) {
        router.push("/");
      }
    };

    checkAuth();
  }, [router]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        name: name.trim(),
        full_name: name.trim(),
      },
    });

    if (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error("Profile update error:", error);
    } else {
      toast.success("Profile updated successfully!");
      router.push("/");
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-lg border">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">
            Just one more step to get started
          </p>
        </div>

        <form onSubmit={handleCompleteProfile} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="w-full h-11 px-4 bg-muted border border-input rounded-lg text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              This email is verified and cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Updating Profile...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
