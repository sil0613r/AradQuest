import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
import "../styles/RegisterPage.css";
import { registerUser, loginUser } from "../services/authService";
import { useAuth } from "../context/useAuth.js";

function RegisterPage() {
  const navigate = useNavigate();

  // Access the shared authentication state.
  const { updateUser } = useAuth();

  // Store the values entered by the user
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Control password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Store validation errors
  const [errors, setErrors] = useState({});

  // Track the registration request state.
  const [isLoading, setIsLoading] = useState(false);

  // Check if the user accepted the terms
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Calculate password strength
  const getPasswordStrength = (password) => {
    if (!password) {
      return { label: "", score: 0 };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = "Weak";

    if (score >= 4) {
      label = "Strong";
    } else if (score >= 3) {
      label = "Medium";
    }

    return { label, score };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Update a field whenever the user types
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    // Clear the corresponding error
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
      form: "",
    }));
  };

  // Validate the registration form
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Please enter a username.";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must contain at least 3 characters.";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Please enter a password.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    // Terms validation
    if (!acceptedTerms) {
      newErrors.terms = "You must accept the Terms and Privacy Policy.";
    }

    return newErrors;
  };

  // Validate the form and register the user.
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prevent duplicate registration requests.
    if (isLoading) return;

    // Validate all registration fields.
    const validationErrors = validateForm();
    setErrors(validationErrors);

    // Stop if any validation errors exist.
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      // Register the user using mock authentication or FastAPI.
      const data = await registerUser(
        formData.username,
        formData.email,
        formData.password,
      );

      // Verify that the account was successfully created.
      if (data?.status !== "succes" || !data?.user_id) {
        throw new Error(data?.mesaj || "Invalid registration response.");
      }

      // Automatically log in after successful registration.
      const loginData = await loginUser(formData.email, formData.password);

      // Verify that authentication succeeded.
      if (!loginData?.user) {
        throw new Error("Unable to authenticate after registration.");
      }

      // Save the authenticated user in AuthContext.
      updateUser(loginData.user);

      // Redirect the user directly to HomePage.
      navigate("/home", { replace: true });
    } catch (error) {
      // Log the error for debugging.
      console.error("Registration error:", error);

      // Display a friendly error message.
      const message =
        error instanceof TypeError
          ? "Unable to complete registration. Please check the console."
          : error.message || "Registration failed. Please try again.";

      setErrors((previousErrors) => ({
        ...previousErrors,
        form: message,
      }));
    } finally {
      // Restore the registration button.
      setIsLoading(false);
    }
  };

  return (
    <main className="register-page">
      <img className="register-logo" src={aradQuestLogo} alt="Logo AradQuest" />

      <section className="register-container">
        <header className="register-header">
          <h1>GLAD TO SEE YOU</h1>

          <p className="register-subtitle">
            Join us and have the greatest adventure of your life!
          </p>
        </header>

        {/* Registration form */}
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="register-field">
            <label htmlFor="username">Username:</label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
            />

            {errors.username && (
              <p className="register-error" id="username-error">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="register-field">
            <label htmlFor="register-email">Email:</label>

            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />

            {errors.email && (
              <p className="register-error" id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="register-field">
            <label htmlFor="register-password">Password:</label>

            <div className="register-password-wrapper">
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Password strength indicator */}
            {formData.password && (
              <div className="password-strength">
                <div
                  className="password-strength-track"
                  role="progressbar"
                  aria-label="Password strength"
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={passwordStrength.score}
                >
                  <div
                    className={`password-strength-fill strength-${passwordStrength.score}`}
                  />
                </div>

                <span>Password strength: {passwordStrength.label}</span>
              </div>
            )}

            {errors.password && (
              <p className="register-error" id="password-error">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="register-field">
            <label htmlFor="confirm-password">Confirm Password:</label>

            <div className="register-password-wrapper">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                aria-label={
                  showConfirmPassword
                    ? "Hide password confirmation"
                    : "Show password confirmation"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="register-error" id="confirm-password-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Terms and Privacy Policy */}
          <div className="register-terms-container">
            <label className="register-terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                aria-invalid={Boolean(errors.terms)}
              />

              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noreferrer">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {errors.terms && <p className="register-error">{errors.terms}</p>}
          </div>

          {/* General error message */}
          {errors.form && (
            <p className="register-error" role="alert">
              {errors.form}
            </p>
          )}

          {/* Submit the registration form. */}
          <button
            className="register-submit"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Join now"}
          </button>
        </form>

        <div className="register-login-section">
          <p>Already have an account? Log in right here!</p>

          <div className="register-divider" />

          <Link className="register-login-button" to="/login">
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
