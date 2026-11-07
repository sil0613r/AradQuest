import { createContext } from "react";

// Shared authentication context object. Provided by AuthProvider and read by useAuth.
export const AuthContext = createContext(null);
