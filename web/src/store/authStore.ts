"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (typeof window !== "undefined") {
          localStorage.setItem("realprice_token", token);
        }
      },

      setAuth: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("realprice_token", token);
        }
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("realprice_token");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Recompute isAuthenticated on hydration
      ...(typeof window !== "undefined" &&
        localStorage.getItem("realprice_token")
        ? { isAuthenticated: true }
        : {}),
    }),
    {
      name: "realprice-auth",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);
