import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChefHat, LocateFixed, Lock, Mail, Store, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getDashboardPath, useAuth } from "@/lib/auth";
import { LocationPreview } from "@/components/LocationPreview";
import { getCurrentLocationDetails, type LocationDetails } from "@/lib/location";

export const Route = createFileRoute("/signup")({ component: SignupPage });

type AccountType = "customer" | "restaurant";

function SignupPage() {
  const { authReady, signup, user } = useAuth();
  const nav = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [cuisine, setCuisine] = useState("Nigerian");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<LocationDetails | null>(null);
  const [confirmingLocation, setConfirmingLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && user) {
      nav({ to: getDashboardPath(user), replace: true });
    }
  }, [authReady, nav, user]);

  const captureLocation = async () => {
    setLocating(true);
    try {
      const details = await getCurrentLocationDetails();
      setLocation(details);
      setConfirmingLocation(false);
      toast.success(accountType === "restaurant" ? "Restaurant location pinned" : "Your location has been saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location access failed");
    } finally {
      setLocating(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!location) {
        toast.error(accountType === "restaurant" ? "Pin your restaurant location before creating the account" : "Use your current location before creating your account");
        setLoading(false);
        return;
      }

      if (accountType === "restaurant") {
        const user = await signup(name, email, password, {
          role: "restaurant",
          restaurant: {
            name: restaurantName || `${name}'s Kitchen`,
            cuisine,
            phone,
            address: location.address,
            lat: location.lat,
            lng: location.lng,
          },
        });
        toast.success(`${user.name}, your restaurant is live on BitePass`);
        nav({ to: "/business" });
        return;
      }

      await signup(name, email, password, {
        role: "customer",
        location: {
          address: location.address,
          lat: location.lat,
          lng: location.lng,
        },
      });
      toast.success("Account created! Let's get you fed");
      nav({ to: "/discover" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
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
          {accountType === "restaurant" ? "Pin your kitchen and start receiving preorders" : "Use your location for the right restaurants near you"}
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

        <div className="space-y-3">
          {accountType === "restaurant" && (
            <>
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
            </>
          )}

          <LocationPreview
            coords={location}
            address={location?.address}
            emptyText={accountType === "restaurant" ? "Click below when you are physically at your restaurant." : "Use your current location so BitePass can recommend places close to you."}
          />

          <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
            <button
              type="button"
              onClick={() => setConfirmingLocation(true)}
              disabled={locating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-xs font-bold transition hover:bg-muted disabled:opacity-60"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              {locating ? "Getting location..." : location ? "Update current location" : "Use my current location"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || locating}
          className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "Creating account..." : accountType === "restaurant" ? "Create restaurant account" : "Create account"}
        </button>
      </form>

      {confirmingLocation && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-card">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-warning/15 text-warning">
              <LocateFixed className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold">{accountType === "restaurant" ? "Confirm restaurant location" : "Confirm your location"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {accountType === "restaurant"
                ? "Ensure the location you are currently standing in is the exact location of your restaurant before you proceed."
                : "Use the location you are currently in so BitePass can show the right restaurants around you."}
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={captureLocation}
                className="rounded-xl bg-gradient-primary py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
              >
                Proceed and pin location
              </button>
              <button
                type="button"
                onClick={() => setConfirmingLocation(false)}
                className="rounded-xl border border-border bg-background py-2.5 text-sm font-bold"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => setConfirmingLocation(false)}
                className="py-1.5 text-xs font-semibold text-muted-foreground"
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
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
