import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./components/pages/LandingPage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import AvatarSelectionPage from "./components/pages/AvatarSelectionPage";
import HomePage from "./components/pages/HomePage";
import AdventuresPage from "./components/pages/AdventuresPage";
import AdventureDetailsPage from "./components/pages/AdventureDetailsPage";
import ProfilePage from "./components/pages/ProfilePage";
import AboutPage from "./components/pages/AboutPage";
import SettingsPage from "./components/pages/SettingsPage";
import RewardsPage from "./components/pages/RewardsPage";
import MapPage from "./components/pages/MapPage";
import { AuthProvider } from "./components/context/AuthContext.jsx";
import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* LandingPage */}
          <Route path="/" element={<LandingPage />} />

          {/* LoginPage */}
          <Route path="/login" element={<LoginPage />} />

          {/* RegisterPage */}
          <Route path="/register" element={<RegisterPage />} />

          {/* AvatarSelectionPage */}
          {/* Pages below need a logged-in user; logged-out visitors go to /login */}
          <Route
            path="/choose-avatar"
            element={<ProtectedRoute><AvatarSelectionPage /></ProtectedRoute>}
          />

          {/* HomePage */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

          {/* AdventuresPage */}
          <Route path="/adventures" element={<ProtectedRoute><AdventuresPage /></ProtectedRoute>} />

          {/* AdventureDetailsPage */}
          <Route
            path="/adventures/:adventureId"
            element={<ProtectedRoute><AdventureDetailsPage /></ProtectedRoute>}
          />

          {/* ProfilePage */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* AboutPage (public) */}
          <Route path="/about" element={<AboutPage />} />

          {/* SettingsPage */}
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* RewardsPage */}
          <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />

          {/* MapPage */}
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
