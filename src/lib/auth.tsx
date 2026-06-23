import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { readTable, writeFile, FILES } from "./csv-store";
import { backend } from "./backend";
import { auth, googleProvider } from "./firebase";
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function findLocalUserByCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();
  return readTable<User>(FILES.users).find(
    (user) => normalizeEmail(user.email) === normalizedEmail && (user.password ?? "").trim() === normalizedPassword,
  );
}

function userFromFirebase(params: {
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

async function getOrCreateFirebaseProfile(params: {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}) {
  const users = await backend.users();
  const existing = users.find((entry) => entry.id === params.id);
  if (existing) return existing;
  const user = userFromFirebase(params);
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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await getOrCreateFirebaseProfile({
            id: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
          });
          writeSessionCookie(profile.id);
          writeFile(FILES.session, profile.id);
          setUser(profile);
          return;
        }

        const sid = hasActiveSession() ? readSessionCookie() : "";
        if (sid) {
          const existingUser = (await backend.users()).find((entry) => entry.id === sid);
          if (existingUser) setUser(existingUser);
          else clearSession();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.warn("Auth restore failed", error);
        clearSession();
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();
    let u: User | undefined;
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      u = await getOrCreateFirebaseProfile({
        id: credential.user.uid,
        name: credential.user.displayName,
        email: credential.user.email,
      });
    } catch {
      const users = await backend.users();
      u =
        users.find(
          (user) =>
            normalizeEmail(user.email) === normalizedEmail && (user.password ?? "").trim() === normalizedPassword,
        ) ?? findLocalUserByCredentials(normalizedEmail, normalizedPassword);
    }
    if (!u) throw new Error("Invalid credentials");
    writeSessionCookie(u.id);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    const u = await getOrCreateFirebaseProfile({
      id: credential.user.uid,
      name: credential.user.displayName,
      email: credential.user.email,
    });
    writeSessionCookie(u.id);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const signup = async (name: string, email: string, password: string, options: SignupOptions = { role: "customer" }) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();
    const users = await backend.users();
    if (users.find((user) => normalizeEmail(user.email) === normalizedEmail)) throw new Error("Email already registered");
    const role = options.role === "restaurant" ? "restaurant" : "customer";
    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
    const uid = credential.user.uid;

    const u: User = {
      id: uid,
      name,
      email: normalizedEmail,
      password: normalizedPassword,
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
    signOut(auth).catch(() => {});
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
