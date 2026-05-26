import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FILES, readFile, readTable, writeFile } from "./csv-store";
import type { User } from "./seed";

type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sid = readFile(FILES.session);
    if (sid) {
      const u = readTable<User>(FILES.users).find((x) => x.id === sid);
      if (u) setUser(u);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const u = readTable<User>(FILES.users).find(
      (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password,
    );
    if (!u) throw new Error("Invalid credentials");
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const signup = async (name: string, email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = readTable<User>(FILES.users);
    if (users.find((x) => x.email.toLowerCase() === email.toLowerCase()))
      throw new Error("Email already registered");
    const u: User = {
      id: "u" + Date.now(),
      name, email, password, role: "customer",
      avatar: name.charAt(0).toUpperCase(),
    };
    users.push(u);
    const { writeTable } = await import("./csv-store");
    writeTable(FILES.users, users);
    writeFile(FILES.session, u.id);
    setUser(u);
    return u;
  };

  const logout = () => {
    writeFile(FILES.session, "");
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
