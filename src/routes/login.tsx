import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardPath, useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { authReady, login, loginWithGoogle, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && user) {
      nav({ to: getDashboardPath(user), replace: true });
    }
  }, [authReady, nav, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const u = await login(email, password);
      notify("success", `Welcome back, ${u.name.split(" ")[0]}!`, { id: "login-success" });
      nav({ to: getDashboardPath(u) });
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Login failed", { id: "login-error" });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      notify("success", `Welcome, ${u.name.split(" ")[0]}!`, { id: "google-login-success" });
      nav({ to: getDashboardPath(u) });
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Google sign in failed", {
        id: "google-login-error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero px-5 py-6">
      <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-border/80 bg-background/80 p-5 shadow-card backdrop-blur md:p-7">
          <div className="text-center animate-slide-up">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-glow">
              <img src="/brand-logo.png" alt="BitePass" className="h-14 w-14 object-contain" />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue ordering</p>
          </div>

          <form
            onSubmit={submit}
            className="mt-7 space-y-3 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                required
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <button
            type="button"
            onClick={googleLogin}
            disabled={loading}
            className="mt-3 w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground shadow-soft transition hover:bg-muted disabled:opacity-60"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-semibold text-primary">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
