/**
 * AuthContext — Secure Local Authentication Context
 *
 * Uses Web Crypto API (PBKDF2) for password hashing — no Firebase Auth needed.
 * Data syncs to Firebase Firestore per-user UID as before.
 *
 * Provides:
 *  - currentUser   : user profile object (or null when logged out)
 *  - userProfile   : same object (kept for API compatibility)
 *  - signup        : create account with PBKDF2-hashed password
 *  - login         : verify credentials and start session
 *  - logout        : destroy session and clear local data
 *  - loading       : true while checking existing session on mount
 *  - isAuthenticated / isAdmin
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  localSignup,
  localLogin,
  localLogout,
  getSession,
  getUserByUid,
} from '../utils/localAuth';

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);

  // ── Restore session on page load ─────────────────────────────────────────
  useEffect(() => {
    const session = getSession();
    if (session) {
      const profile = getUserByUid(session.uid);
      if (profile) {
        setCurrentUser(profile);
      }
    }
    setLoading(false);
  }, []);

  // ── Signup ────────────────────────────────────────────────────────────────
  // Creates account + session but does NOT set currentUser.
  // Login.jsx shows the success screen first; user clicks "Sign In" to actually login.
  const signup = async (emailOrUsername, password, displayName) => {
    const profile = await localSignup(displayName, emailOrUsername, password);
    // NOTE: intentionally NOT calling setCurrentUser here
    return profile;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (emailOrUsername, password) => {
    const profile = await localLogin(emailOrUsername, password);
    setCurrentUser(profile);
    return profile;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    localLogout();
    setCurrentUser(null);
  };

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    currentUser,
    userProfile: currentUser,   // alias kept for API compatibility
    signup,
    login,
    logout,
    loading,
    isAdmin: currentUser?.role === 'admin',
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
