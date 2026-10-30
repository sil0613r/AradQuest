import { useNavigate } from "react-router-dom";

import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
import "../styles/LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

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
        <form
          className="login-form"
          onSubmit={(event) => {
            // Prevenim reîncărcarea paginii până conectăm backendul.
            event.preventDefault();
            console.log("Login form submitted");
          }}
        >
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
              required
            />
          </div>

          {/* Opțiunea de menținere a autentificării */}
          <label className="login-remember">
            <input type="checkbox" name="rememberMe" />
            <span>Keep me logged in on this device</span>
          </label>

          {/* Butonul de autentificare */}
          <button className="login-submit" type="submit">
            Log in
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
