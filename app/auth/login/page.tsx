"use client";
import { Suspense } from "react";
import LoginContent from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-lg border animate-pulse">
        <div className="h-16 bg-muted rounded-full" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-4 bg-muted rounded" />
        <div className="space-y-3">
          <div className="h-11 bg-muted rounded-lg" />
          <div className="h-11 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  );
}
