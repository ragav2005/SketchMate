import { Loader2 } from "lucide-react";

const AuthLoading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-lg border">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Authenticating
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your authentication...
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Setting up your session...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLoading;
