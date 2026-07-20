import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import axiosClient from '../api/axiosClient';
import hotelLoginImage from '../assets/hotel-login.png';
import PasswordInput from '../components/PasswordInput';
import { getApiValidationErrors, getPasswordValidationErrors } from '../utils/passwordValidation';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setValidationErrors([]);

    if (!token) {
      setErrorMessage('Reset link is missing a token.');
      return;
    }

    const passwordErrors = getPasswordValidationErrors(formData.password);
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/reset-password', {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setMessage(response.data?.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 1400);
    } catch (error) {
      const apiValidationErrors = getApiValidationErrors(error);
      if (apiValidationErrors.length > 0) {
        setValidationErrors(apiValidationErrors);
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          'Cannot reset password right now. Please request a new reset link.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page auth-flow-page" aria-label="Reset password">
      <Link className="login-home-link" to="/">
        Back to Home
      </Link>

      <div className="login-visual" aria-hidden="true">
        <img src={hotelLoginImage} alt="" />
      </div>

      <div className="login-panel">
        <form className="login-form auth-flow-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-copy">
            <h1>Create New Password</h1>
            <p>
              Your new password must include uppercase, lowercase, number, and special character.
            </p>
          </div>

          <div className="login-fields">
            <label className="login-field">
              <span>New Password</span>
              <PasswordInput
                name="password"
                placeholder="Enter new password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <small className="password-requirement">
                At least 8 characters with uppercase, lowercase, number, and special character.
              </small>
            </label>

            <label className="login-field">
              <span>Confirm Password</span>
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          {message ? <p className="auth-success">{message}</p> : null}
          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
          {validationErrors.length > 0 ? (
            <ul className="password-error-list">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}

          <div className="login-actions auth-flow-actions">
            <button type="submit" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Saving...' : 'Reset Password'}
            </button>

            <div className="register-prompt">
              <span>Already updated?</span>
              <Link to="/login">Login Now</Link>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
