import { useState } from "react";
import { useNavigate } from "react-router-dom";

import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/useAuth.js";

import "../styles/LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  // Access the shared authentication state.
  const { updateUser } = useAuth();
  // Store the user's login credentials.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Manage authentication feedback and loading state.
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    // Clear previous authentication errors.
    setLoginError("");

    // Validate the required fields.
    if (!email.trim() || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Send credentials to the Python backend.
      const data = await loginUser(email.trim(), password);

      // Redirect only after successful authentication.
      // The backend response should contain the user's profile.
      if (!data.user) {
        throw new Error("Invalid authentication response.");
      }
      // Store the authenticated user in React context.
      updateUser(data.user);

      navigate("/home", { replace: true });
    } catch (error) {
      // Show a friendly message when the backend is unavailable.
      if (error instanceof TypeError) {
        setLoginError(
          "Unable to connect to the server. Please try again later.",
        );
      } else {
        // Display authentication errors returned by the API.
        setLoginError(
          error.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <img className="login-logo" src={aradQuestLogo} alt="Logo AradQuest" />

      <section className="login-container">
        {/* Titlul și descrierea paginii */}
        <header className="login-header">
          <h1 className="login-title">WELCOME BACK.</h1>

          <p className="login-subtitle">
            Log in to resume your adventures and get your rewards.
          </p>
        </header>

        {/* Formularul de autentificare */}
        <form className="login-form" onSubmit={handleLogin}>
          {/* Câmpul pentru email */}
          <div className="login-field">
            <label className="login-label" htmlFor="email">
              Email:
            </label>

            <input
              className="login-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Câmpul pentru parolă */}
          <div className="login-field">
            <div className="login-label-row">
              <label className="login-label" htmlFor="password">
                Password:
              </label>

              <button
                type="button"
                className="login-forgot"
                onClick={() => {
                  console.log("Forgot password clicked");
                }}
              >
                Forgot password?
              </button>
            </div>

            <input
              className="login-input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Opțiunea de menținere a autentificării */}
          <label className="login-remember">
            <input type="checkbox" name="rememberMe" />
            <span>Keep me logged in on this device</span>
          </label>

          {/* Display authentication errors. */}
          {loginError && (
            <div className="login-error" role="alert">
              <span aria-hidden="true">⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          {/* Butonul de autentificare */}

          {/* Submit the login form. */}
          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Secțiunea pentru utilizatorii care nu au cont */}
        <div className="create-account-section">
          <p>New around here? Create an account right now for free!</p>

          <div className="login-divider" />

          <button
            type="button"
            className="create-account-button"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
