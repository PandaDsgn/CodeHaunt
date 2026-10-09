import { createContext, useContext, useState } from "react";
import { api } from "./api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(localStorage.getItem("role"));

  async function login(email, password) {
    const { access_token, role } = await api.login(email, password);
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", role);
    setRole(role);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ role, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
