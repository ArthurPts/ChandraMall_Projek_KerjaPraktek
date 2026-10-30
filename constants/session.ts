import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
};

const STORAGE_KEY = "@chandra_mall_user_session";

let currentUser: SessionUser | null = null;
let isInitialized = false;
const listeners = new Set<(user: SessionUser | null) => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(currentUser);
    } catch (e) {
      console.error("Error in session listener:", e);
    }
  });
}

/**
 * Initializes the session from persistent AsyncStorage
 */
export async function initSession(): Promise<SessionUser | null> {
  if (isInitialized) return currentUser;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentUser = JSON.parse(raw);
    } else {
      currentUser = null;
    }
  } catch (err) {
    console.error("Failed to load session from storage:", err);
    currentUser = null;
  } finally {
    isInitialized = true;
    notifyListeners();
  }
  return currentUser;
}

/**
 * Persists the user in storage and in-memory
 */
export function setSessionUser(user: SessionUser | null) {
  currentUser = user;
  if (user) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)).catch((err) =>
      console.error("Failed to save session to storage:", err)
    );
  } else {
    AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
      console.error("Failed to remove session from storage:", err)
    );
  }
  notifyListeners();
}

/**
 * Logs out user and cleans up persistent storage
 */
export async function logoutUser(): Promise<void> {
  currentUser = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing user session:", err);
  }
  notifyListeners();
}

/**
 * Synchronous getters
 */
export function getSessionUser(): SessionUser | null {
  return currentUser;
}

export function getSessionUserId(): number | null {
  return currentUser?.id ?? null;
}

/**
 * React hook to observe session state across any component
 */
export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(currentUser);
  const [loading, setLoading] = useState<boolean>(!isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initSession().then((u) => {
        setUser(u);
        setLoading(false);
      });
    } else {
      setUser(currentUser);
      setLoading(false);
    }

    const handler = (updatedUser: SessionUser | null) => {
      setUser(updatedUser);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    user,
    userId: user?.id ?? null,
    isLoggedIn: !!user,
    loading,
    logout: logoutUser,
    setUser: setSessionUser,
  };
}
