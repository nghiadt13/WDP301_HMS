import { useState } from 'react';
import { Link } from 'react-router-dom';

import axiosClient from '../api/axiosClient';
import hotelLoginImage from '../assets/hotel-login.png';

const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/forgot-password', {
        identifier
      });

      setMessage(response.data?.message || 'Password reset email has been sent. Please check your inbox.');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          'Cannot send password reset email right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page auth-flow-page" aria-label="Forgot password">
      <Link className="login-home-link" to="/">
        Back to Home
      </Link>

      <div className="login-visual" aria-hidden="true">
        <img src={hotelLoginImage} alt="" />
      </div>

      <div className="login-panel">
        <form className="login-form auth-flow-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-copy">
            <h1>Forgot Password</h1>
            <p>
              Enter your login account or email. Hotelify will send a secure reset link
              to the email connected with your account.
            </p>
          </div>

          <label className="login-field">
            <span>Email or Login Account</span>
            <input
              type="text"
              placeholder="Enter email or login account"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>

          {message ? <p className="auth-success">{message}</p> : null}
          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

          <div className="login-actions auth-flow-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Email'}
            </button>

            <div className="register-prompt">
              <span>Remember your password?</span>
              <Link to="/login">Back to Login</Link>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
