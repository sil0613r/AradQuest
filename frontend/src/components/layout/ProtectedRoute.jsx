import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

// Opens the page only for a logged-in user. Waits for the session check before deciding.
function ProtectedRoute({ children }) {
  const { user, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
