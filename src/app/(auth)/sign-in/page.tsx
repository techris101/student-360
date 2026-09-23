"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    errorParam ? "Authentication failed or session expired. Please try again." : null
  );

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage(null);

    const siteUrl = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSubmitted(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);

    const siteUrl = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      setErrorMessage(
        "Google sign-in is not yet configured or failed. Please use email magic link."
      );
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)]">
      <div className="w-full max-w-sm rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <Link href="/" className="text-2xl font-semibold tracking-tight inline-block">
            Student <span className="text-[var(--teal)]">360</span>
          </Link>
          <p className="text-sm text-[var(--ink-2)]">
            Sign in to check opportunities against your profile.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-[6px] border border-[var(--red)] bg-[var(--red-subtle)] p-3 text-xs text-[var(--red)]">
            {errorMessage}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-2">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                Check your email
              </h2>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                We sent a magic link to <strong className="text-[var(--ink)]">{email}</strong>. Click the link in the message to sign in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs text-[var(--teal)] hover:underline"
            >
              Use a different email address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Sign In */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
            >
              {googleLoading ? "Connecting to Google..." : "Continue with Google"}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[var(--line)]" />
              <span className="bg-[var(--surface)] px-2 text-xs text-[var(--muted)] absolute">
                or
              </span>
            </div>

            {/* Magic Link Form */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium text-[var(--ink)]">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@university.ac.rw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending magic link..." : "Send magic link"}
              </Button>
            </form>
          </div>
        )}

        <div className="text-center pt-2 border-t border-[var(--line)]">
          <p className="text-xs text-[var(--muted)]">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[var(--ink)]">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[var(--ink)]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)]">
          <div className="w-full max-w-sm rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--ink-2)]">
            Loading sign in...
          </div>
        </main>
      }
    >
      <SignInForm />
    </React.Suspense>
  );
}
