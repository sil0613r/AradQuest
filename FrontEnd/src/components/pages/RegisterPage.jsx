import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import aradQuestLogo from "../../assets/images/backgrounds/aradquest-logo.png";
import "../styles/RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  // We store the values entered by the user in the form.
  //This is an obj
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // We control if the password will be hidden or not
  const [showPassword, setShowPassword] = useState(false);

  // We control the display of the password confirmation separately
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // We will keep the error messages
  const [errors, setErrors] = useState({});

  // Check if the user accepted the terms
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Calculate the password s strength
  const getPasswordStrength = (password) => {
    if (!password) {
      return { label: "", score: 0 };
    }

    let score = 0;

    // Check for:
    //passwords length
    if (password.length >= 8) score++;

    // lowercase
    if (/[a-z]/.test(password)) score++;

    // Uppercase
    if (/[A-Z]/.test(password)) score++;

    // Digit
    if (/[0-9]/.test(password)) score++;

    // Symbol
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = "Weak";

    if (score >= 4) {
      label = "Strong";
    } else if (score >= 3) {
      label = "Medium";
    }

    return { label, score };
  };

  // Calculate the strength indicator for the entered password.
  const passwordStrength = getPasswordStrength(formData.password);

  // Function for updating a field's value whenever the user types.
  const handleChange = (event) => {
    //destructuring
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    // Clear the field's error message as the field is modified. Form Errors
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: "",
      form: "",
    }));
  };

  // Check if the form is completed correctly
  //Validation Function
  const validateForm = () => {
    const newErrors = {};

    // Check the username
    if (!formData.username.trim()) {
      newErrors.username = "Please enter a username.";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must contain at least 3 characters.";
    }

    // Check the email
    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Check the password
    if (!formData.password) {
      newErrors.password = "Please enter a password.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    }

    // Check if the passwords are the same
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    // Check if the user accepted the terms
    if (!acceptedTerms) {
      newErrors.terms = "You must accept the Terms and Privacy Policy.";
    }

    return newErrors;
  };

  // Process the submitting of the form
  const handleSubmit = (event) => {
    // Won't allow to reload the current page
    event.preventDefault();

    // Check all the fields before submitting
    const validationErrors = validateForm();

    setErrors(validationErrors);

    // If there are errors, we won't continue
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    console.log("Registration form is valid.");

    navigate("/choose-avatar");
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

        {/* register form. */}
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

            {/* Password's strength indicator*/}
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

          {/* Terms and confidence */}
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

          {/* General error message if necessary */}
          {errors.form && (
            <p className="register-error" role="alert">
              {errors.form}
            </p>
          )}

          <button className="register-submit" type="submit">
            Join now
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
