import { useContext } from "react";

import { AuthContext } from "./authContextObject.js";

// Allow components to access authentication state.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
