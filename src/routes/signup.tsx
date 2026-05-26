import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChefHat, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success("Account created! Let's get you fed 🍴");
      nav({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-hero px-5 pt-6">
      <Link to="/login" className="grid h-10 w-10 place-items-center rounded-full bg-card shadow-soft">
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="mt-8 text-center animate-slide-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
          <ChefHat className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start preordering in seconds</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
          <User className="h-4 w-4 text-muted-foreground" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" required />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" required />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" required minLength={4} />
        </label>

        <button type="submit" disabled={loading}
          className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link>
      </p>
    </div>
  );
}
