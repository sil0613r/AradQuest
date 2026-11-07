//this will be the context for the auth state, it will provide the auth state to all components that need it

import { useEffect, useState } from "react";

import { getCurrentUser, logoutUser } from "../services/authService.js";
import { AuthContext } from "./authContextObject.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");

  // Restore the authenticated session when the app starts.
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update the authenticated user after login or registration.
  const updateUser = (userData) => {
    setUser(userData);
    setAuthError("");
  };

  // Request logout and clear the authenticated user.
  const logout = async () => {
    await logoutUser();
    setUser(null);
    setAuthError("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isCheckingAuth,
        authError,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}