"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { firebaseAuth, firebaseReady } from "@/lib/firebase";

const AuthContext = createContext(null);

function resolveRoleFromClaims(claims) {
  if (!claims) return "customer";
  if (claims.role === "admin" || claims.admin === true) return "admin";
  return claims.role || "customer";
}

export function AuthProvider({ children }) {
  const authEventId = useRef(0);
  const [state, setState] = useState({
    firebaseUser: null,
    role: null,
    loading: true,
  });

  const refreshAuth = useCallback(async (force = true) => {
    if (!firebaseAuth?.currentUser) {
      setState({ firebaseUser: null, role: null, loading: false });
      return null;
    }
    try {
      const tokenResult = await firebaseAuth.currentUser.getIdTokenResult(force);
      const role = resolveRoleFromClaims(tokenResult.claims);
      setState({
        firebaseUser: firebaseAuth.currentUser,
        role,
        loading: false,
      });
      return role;
    } catch (err) {
      console.error("Failed to refresh token claims:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setState({ firebaseUser: null, role: null, loading: false });
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const eventId = ++authEventId.current;
      if (!firebaseUser) {
        setState({ firebaseUser: null, role: null, loading: false });
        return;
      }

      setState({ firebaseUser, role: null, loading: true });
      try {
        // 1. Read custom role metadata directly from the Firebase Auth JWT
        let tokenResult = await firebaseUser.getIdTokenResult();
        let role = resolveRoleFromClaims(tokenResult.claims);

        // 2. If claims not present in cached token, force-refresh the JWT once
        if (role !== "admin") {
          try {
            tokenResult = await firebaseUser.getIdTokenResult(true);
            role = resolveRoleFromClaims(tokenResult.claims);
          } catch {
            // ignore network refresh issue
          }
        }

        if (eventId === authEventId.current)
          setState({ firebaseUser, role: role || "customer", loading: false });
      } catch {
        if (eventId === authEventId.current)
          setState({ firebaseUser, role: "customer", loading: false });
      }
    });

    // Listen for cross-module auth refresh notifications (e.g. from apiFetch 401 retry)
    const handleAuthRefresh = () => {
      refreshAuth(false);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("ssv:auth-refresh", handleAuthRefresh);
    }

    return () => {
      authEventId.current += 1;
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("ssv:auth-refresh", handleAuthRefresh);
      }
    };
  }, [refreshAuth]);

  const value = {
    ...state,
    configured: firebaseReady,
    refreshAuth,
    signInWithGoogle: () =>
      signInWithPopup(firebaseAuth, new GoogleAuthProvider()),
    signInWithEmail: (email, password) =>
      signInWithEmailAndPassword(firebaseAuth, email, password),
    signUpWithEmail: (email, password) =>
      createUserWithEmailAndPassword(firebaseAuth, email, password),
    resetPassword: (email) => sendPasswordResetEmail(firebaseAuth, email),
    signOut: () => signOut(firebaseAuth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
