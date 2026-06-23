import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readTable, writeFile, FILES } from "./csv-store";
import { backend } from "./backend";
import { isSupabaseConfigured, supabase } from "./supabase";
import { clearSession, hasActiveSession, readSessionCookie, writeSessionCookie } from "./session-cookie";
import type { Restaurant, User } from "./seed";

type SignupOptions =
  | { role?: "customer"; location?: { address: string; lat: number; lng: number } }
  | {
      role: "restaurant";
      restaurant: {
        name: string;
        cuisine: string;
        phone: string;
        address?: string;
        lat?: number;
        lng?: number;
      };
    };

type AuthCtx = {
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  signup: (name: string, email: string, password: string, options?: SignupOptions) => Promise<User>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const useSupabaseAuth = import.meta.env.VITE_AUTH_BACKEND === "supabase" && isSupabaseConfigured;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createLocalId(prefix = "u") {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function findLocalUserByCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();
  return readTable<User>(FILES.users).find(
    (user) => normalizeEmail(user.email) === normalizedEmail && (user.password ?? "").trim() === normalizedPassword,
  );
}

function userFromAuth(params: {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}): User {
  const name = params.name?.trim() || params.email?.split("@")[0] || "BitePass user";
  return {
    id: params.id,
    name,
    email: normalizeEmail(params.email ?? ""),
    password: "",
    role: params.role ?? "customer",
    avatar: name.charAt(0).toUpperCase(),
  };
}

async function getOrCreateAuthProfile(params: {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}) {
  const users = await backend.users();
  const existing = users.find((entry) => entry.id === params.id || normalizeEmail(entry.email) === normalizeEmail(params.email ?? ""));
  if (existing) return existing;
  const user = userFromAuth(params);
  await backend.setUser(user);
  return user;
}

export function getDashboardPath(user: Pick<User, "role">): "/admin" | "/business" | "/discover" {
  return user.role === "admin" ? "/admin" : user.role === "restaurant" ? "/business" : "/discover";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreLocalSession() {
      const sid = hasActiveSession() ? readSessionCookie() : "";
      if (!sid) {
        setUser(null);
        return;
      }

      const existingUser = (await backend.users()).find((entry) => entry.id === sid);
      if (cancelled) return;

      if (existingUser) {
        setUser(existingUser);
      } else {
        clearSession();
        setUser(null);
      }
    }

    async function restoreSession() {
      if (useSupabaseAuth && supabase) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const authUser = data.session?.user;

        if (authUser) {
          const profile = await getOrCreateAuthProfile({
            id: authUser.id,
            name: authUser.user_metadata?.name as string | undefined,
            email: authUser.email,
            role: authUser.user_metadata?.role as string | undefined,
          });
          if (cancelled) return;
          writeSessionCookie(profile.id);
          writeFile(FILES.session, profile.id);
          setUser(profile);
          return;
        }
      }

      await restoreLocalSession();
    }

    restoreSession()
      .catch((error) => {
        if (cancelled) return;
        console.warn("Auth restore failed", error);
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });

    const subscription = useSupabaseAuth && supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          const authUser = session?.user;
          if (!authUser) return;

          void getOrCreateAuthProfile({
            id: authUser.id,
            name: authUser.user_metadata?.name as string | undefined,
            email: authUser.email,
            role: authUser.user_metadata?.role as string | undefined,
          }).then((profile) => {
            if (cancelled) return;
            writeSessionCookie(profile.id);
            writeFile(FILES.session, profile.id);
            setUser(profile);
            setAuthReady(true);
          });
        }).data.subscription
      : null;

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();

    if (useSupabaseAuth && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      if (error) throw error;
      if (!data.user) throw new Error("Login failed");

      const u = await getOrCreateAuthProfile({
        id: data.user.id,
        name: data.user.user_metadata?.name as string | undefined,
        email: data.user.email,
        role: data.user.user_metadata?.role as string | undefined,
      });
      writeSessionCookie(u.id);
      writeFile(FILES.session, u.id);
      setUser(u);
      return u;
    }

    const users = await backend.users();
    const u =
      users.find(
        (user) => normalizeEmail(user.email) === normalizedEmail && (user.password ?? "").trim() === normalizedPassword,
      ) ?? findLocalUserByCredentials(normalizedEmail, normalizedPassword);

    if (!u) throw new Error("Invalid credentials");
    writeSessionCookie(u.id);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const loginWithGoogle = async () => {
    if (!useSupabaseAuth || !supabase) {
      throw new Error("Google sign in needs Supabase configuration");
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/discover",
      },
    });
    if (error) throw error;

    return new Promise<User>(() => {});
  };

  const signup = async (name: string, email: string, password: string, options: SignupOptions = { role: "customer" }) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();
    const role = options.role === "restaurant" ? "restaurant" : "customer";
    let id = createLocalId(role === "restaurant" ? "owner" : "u");

    if (useSupabaseAuth && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          data: {
            name,
            role,
          },
        },
      });
      if (error) throw error;
      if (data.user) id = data.user.id;
    } else {
      const users = await backend.users();
      if (users.find((user) => normalizeEmail(user.email) === normalizedEmail)) throw new Error("Email already registered");
    }

    const u: User = {
      id,
      name,
      email: normalizedEmail,
      password: useSupabaseAuth ? "" : normalizedPassword,
      role,
      avatar: name.charAt(0).toUpperCase(),
      address: options.role !== "restaurant" ? options.location?.address : undefined,
      lat: options.role !== "restaurant" ? String(options.location?.lat ?? "") : undefined,
      lng: options.role !== "restaurant" ? String(options.location?.lng ?? "") : undefined,
    };
    await backend.setUser(u);

    if (options.role === "restaurant") {
      const restaurant: Restaurant = {
        id: "r" + Date.now(),
        ownerId: u.id,
        name: options.restaurant.name,
        cuisine: options.restaurant.cuisine,
        rating: "0",
        reviews: "0",
        prepTime: "15",
        distance: "0",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=70",
        tags: `${options.restaurant.cuisine}|New`,
        isOpen: "1",
        description: `${options.restaurant.name} is now taking preorders on BitePass.`,
        address: options.restaurant.address ?? "",
        phone: options.restaurant.phone,
        lat: String(options.restaurant.lat ?? ""),
        lng: String(options.restaurant.lng ?? ""),
      };
      await backend.setRestaurant(restaurant);
    }

    writeSessionCookie(u.id);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const logout = () => {
    clearSession();
    writeFile(FILES.session, "");
    setUser(null);
    if (useSupabaseAuth && supabase) {
      void supabase.auth.signOut();
    }
  };

  const updateProfile = async (patch: Partial<User>) => {
    const currentUser = user;
    if (!currentUser) return;
    await backend.updateUser(currentUser.id, patch);
    setUser({ ...currentUser, ...patch });
  };

  return <Ctx.Provider value={{ user, authReady, login, loginWithGoogle, signup, updateProfile, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
