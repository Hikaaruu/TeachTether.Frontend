import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "../api/client";
import { UserRole } from "../types/roles";
import { saveToken, clearToken } from "./tokenStorage";

type UserInfo = {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  sex: string;
  role: UserRole;
  entityId: number;
  schoolId?: number | null;
};

type Credentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: UserInfo | null;
  login: (creds: Credentials) => Promise<void>;
  logout: () => void;
  ready: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get<UserInfo>("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = async (creds: Credentials) => {
    const res = await api.post<{ token: string }>("/auth/login", creds);
    saveToken(res.data.token);
    const me = await api.get<UserInfo>("/auth/me");
    setUser(me.data);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
