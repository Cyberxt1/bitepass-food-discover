import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { readTable, writeFile, FILES } from "./csv-store";
import { backend } from "./backend";
import { getFirebase } from "./firebase";
import { readSessionCookie, writeSessionCookie } from "./session-cookie";
import type { Restaurant, User } from "./seed";

type SignupOptions =
  | { role?: "customer"; location?: { address: string; lat: number; lng: number } }
  | {
      role: "restaurant";
      restaurant: {
        name: string;
        cuisine: string;
        phone: string;
        address: string;
        lat: number;
        lng: number;
      };
    };

type AuthCtx = {
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, options?: SignupOptions) => Promise<User>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let unsub: undefined | (() => void);
    getFirebase()
      .then(({ auth, authSdk }) => {
        unsub = authSdk.onAuthStateChanged(auth, async (firebaseUser: { uid: string } | null) => {
          if (!firebaseUser) {
            setUser(null);
            setAuthReady(true);
            return;
          }
          const u = (await backend.users()).find((x) => x.id === firebaseUser.uid);
          if (u) {
            writeSessionCookie(u.id);
            writeFile(FILES.session, u.id);
            setUser(u);
          }
          setAuthReady(true);
        }) as () => void;
      })
      .catch(async () => {
        const sid = readSessionCookie();
        if (sid) {
          const u = (await backend.users()).find((x) => x.id === sid) ?? readTable<User>(FILES.users).find((x) => x.id === sid);
          if (u) setUser(u);
        }
        setAuthReady(true);
      });
    return () => unsub?.();
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    let u: User | undefined;
    try {
      const { auth, authSdk } = await getFirebase();
      const credential = await authSdk.signInWithEmailAndPassword(auth, email, password) as { user: { uid: string } };
      u = (await backend.users()).find((x) => x.id === credential.user.uid);
    } catch {
      u = readTable<User>(FILES.users).find(
        (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password,
      );
    }
    if (!u) throw new Error("Invalid credentials");
    writeSessionCookie(u.id);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const signup = async (name: string, email: string, password: string, options: SignupOptions = { role: "customer" }) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = readTable<User>(FILES.users);
    if (users.find((x) => x.email.toLowerCase() === email.toLowerCase())) throw new Error("Email already registered");
    const role = options.role === "restaurant" ? "restaurant" : "customer";
    let uid = "u" + Date.now();
    try {
      const { auth, authSdk } = await getFirebase();
      const credential = await authSdk.createUserWithEmailAndPassword(auth, email, password) as { user: { uid: string } };
      uid = credential.user.uid;
    } catch (error) {
      console.warn("Firebase Auth signup unavailable, using local account", error);
    }

    const u: User = {
      id: uid,
      name,
      email,
      password,
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
        address: options.restaurant.address,
        phone: options.restaurant.phone,
        lat: String(options.restaurant.lat),
        lng: String(options.restaurant.lng),
      };
      await backend.setRestaurant(restaurant);
    }

    writeSessionCookie(u.id);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const logout = () => {
    writeSessionCookie("");
    writeFile(FILES.session, "");
    setUser(null);
    getFirebase()
      .then(({ auth, authSdk }) => authSdk.signOut(auth))
      .catch(() => {});
  };

  return <Ctx.Provider value={{ user, authReady, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
