import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChefHat, Lock, Mail, Store, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardPath, useAuth } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export const Route = createFileRoute("/signup")({ component: SignupPage });

type AccountType = "customer" | "restaurant";

function SignupPage() {
  const { authReady, loginWithGoogle, signup, user } = useAuth();
  const nav = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("Nigerian");
  const [phone, setPhone] = useState("");
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
      if (accountType === "restaurant") {
        const user = await signup(name, email, password, {
          role: "restaurant",
          restaurant: {
            name: restaurantName || `${name}'s Kitchen`,
            cuisine,
            phone,
          },
        });
        notify("success", `${user.name}, your restaurant is live on BitePass`, { id: "signup-restaurant-success" });
        nav({ to: "/business" });
        return;
      }

      await signup(name, email, password, {
        role: "customer",
      });
      notify("success", "Account created! Let's get you fed", { id: "signup-customer-success" });
      nav({ to: "/discover" });
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Signup failed", { id: "signup-error" });
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      notify("success", `Welcome to BitePass, ${u.name.split(" ")[0]}!`, { id: "google-signup-success" });
      nav({ to: getDashboardPath(u) });
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Google signup failed", { id: "google-signup-error" });
    } finally {
      setLoading(false);
    }
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
        <p className="mt-1 text-sm text-muted-foreground">
          {accountType === "restaurant" ? "Create your kitchen profile. Location can come later." : "Location is optional. You can add it later for nearby picks."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-card p-1 shadow-soft animate-slide-up">
        <button
          type="button"
          onClick={() => setAccountType("customer")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            accountType === "customer" ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
          }`}
        >
          <User className="h-3.5 w-3.5" /> Customer
        </button>
        <button
          type="button"
          onClick={() => setAccountType("restaurant")}
          className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
            accountType === "restaurant" ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
          }`}
        >
          <Store className="h-3.5 w-3.5" /> Restaurant
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <Field icon={User}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={accountType === "restaurant" ? "Owner full name" : "Full name"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            required
          />
        </Field>
        <Field icon={Mail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            required
          />
        </Field>
        <Field icon={Lock}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            required
            minLength={4}
          />
        </Field>

        {accountType === "restaurant" && (
          <div className="space-y-3">
            <Field icon={Store}>
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Restaurant name"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="Cuisine"
                className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary"
                required
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary"
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Creating account..." : accountType === "restaurant" ? "Create restaurant account" : "Create account"}
        </button>
      </form>

      {accountType === "customer" && (
        <button
          type="button"
          onClick={googleSignup}
          disabled={loading}
          className="mt-3 w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground shadow-soft transition hover:bg-muted disabled:opacity-60"
        >
          Continue with Google
        </button>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link>
      </p>
    </div>
  );
}

function Field({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </label>
  );
}
