import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/pages/LandingPage";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import AvatarSelectionPage from "./components/pages/AvatarSelectionPage";

function App() {
  return (
    // browser allows the navigation between pages
    <BrowserRouter>
      <Routes>
        {/* LandingPage  */}
        <Route path="/" element={<LandingPage />} />
        {/* LoginPage */}
        <Route path="/login" element={<LoginPage />} />
        {/* RegisterPage */}
        <Route path="/register" element={<RegisterPage />} />
        {/* AvatarSelectionPage */}
        <Route path="/choose-avatar" element={<AvatarSelectionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
