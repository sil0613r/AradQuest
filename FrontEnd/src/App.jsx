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
          <Route path="/choose-avatar" element={<AvatarSelectionPage />} />

          {/* HomePage */}
          <Route path="/home" element={<HomePage />} />

          {/* AdventuresPage */}
          <Route path="/adventures" element={<AdventuresPage />} />

          {/* AdventureDetailsPage */}
          <Route
            path="/adventures/:adventureId"
            element={<AdventureDetailsPage />}
          />

          {/* ProfilePage */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* AboutPage */}
          <Route path="/about" element={<AboutPage />} />

          {/* SettingsPage */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* RewardsPage */}
          <Route path="/rewards" element={<RewardsPage />} />

          {/* MapPage */}
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
