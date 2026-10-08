"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
  Sprout,
  User,
} from "lucide-react";
import { useStore } from "@/providers/store";
import { useToast } from "@/providers/toast";
import { demoAccounts } from "@/lib/demo-data";
import { cn } from "@/lib/cn";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, login, signup } = useStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "signin" && !password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await signup(name, email, password);
        if (!res.ok) {
          setError(res.error ?? "Unable to create your account.");
          return;
        }
        if (res.needsConfirmation) {
          toast(
            "success",
            "Check your email",
            "We sent a confirmation link to finish signing up."
          );
        } else {
          toast("success", "Account created", "You're signed in.");
          router.replace("/dashboard");
        }
        setMode("signin");
        return;
      }

      const res = await login(email, password);
      if (!res.ok) {
        setError(res.error ?? "Unable to sign in.");
        return;
      }
      toast("success", "Welcome back", "Signed in securely.");
      router.replace("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  const quickFill = (account: (typeof demoAccounts)[number]) => {
    // Autofill the email only. The password is never hardcoded into the UI —
    // it is the shared demo password from the seed script. Login still runs
    // through real Supabase authentication on submit.
    setEmail(account.email);
    setPassword("");
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-base shadow-neu md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-leaf-dark to-leaf p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">CROPVAULT</p>
              <p className="text-xs text-white/70">Smart Crop Warehouse</p>
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black leading-tight">
              Know exactly what is stored — and what needs attention.
            </h1>
            <p className="text-sm text-white/80">
              Track batches, freshness and movement across every warehouse in
              real time. Built for warehouse workers and managers.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 text-sm backdrop-blur">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span>Your warehouse data is protected.</span>
          </div>
        </div>

        {/* Form panel */}
        <div className="p-7 sm:p-10">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-base text-leaf-dark shadow-neu-sm">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-ink">CROPVAULT</p>
              <p className="text-xs text-ink-faint">Smart Crop Warehouse</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ink">
            {mode === "signup" ? "Create your account" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "signup"
              ? "Join CROPVAULT and start tracking your warehouse inventory."
              : "Access your warehouse inventory dashboard."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label className="neu-label" htmlFor="name">
                  Full name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="neu-input pl-10"
                    placeholder="Priya Nair"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="neu-label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="neu-input pl-10"
                  placeholder="you@cropvault.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="neu-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  className="neu-input px-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition hover:text-ink"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer select-none items-center gap-2 text-ink-soft">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-md bg-base shadow-inset-sm transition",
                      remember && "text-leaf-dark"
                    )}
                  >
                    {remember && (
                      <span className="h-2.5 w-2.5 rounded-sm bg-leaf" />
                    )}
                  </span>
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast(
                      "info",
                      "Password reset",
                      "A reset link would be sent by your backend."
                    )
                  }
                  className="font-semibold text-leaf-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-chili/10 px-3 py-2 text-sm font-medium text-chili">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="neu-btn-primary w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "signup" ? "Creating account…" : "Signing in…"}
                </>
              ) : mode === "signup" ? (
                <>
                  <User className="h-4 w-4" /> Create account
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Login securely
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-ink-soft">
            {mode === "signup" ? (
              <>
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="font-semibold text-leaf-dark hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                <span>New to CROPVAULT?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-semibold text-leaf-dark hover:underline"
                >
                  Create an account
                </button>
              </>
            )}
          </div>

          {mode === "signin" && (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                Demo accounts · click to fill email · sign-in uses Supabase Auth
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {demoAccounts.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => quickFill(a)}
                    className="neu-btn !px-2 !py-2 text-center text-[11px] leading-tight"
                  >
                    <span className="mx-auto block font-bold text-ink">{a.label}</span>
                    <span className="mx-auto block truncate text-[10px] text-ink-faint">
                      {a.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-faint">
            <ShieldCheck className="h-4 w-4 text-leaf" />
            <span>Your warehouse data is protected.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
