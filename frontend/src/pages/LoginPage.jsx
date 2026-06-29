import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import axiosClient from '../api/axiosClient';
import hotelLoginImage from '../assets/hotel-login.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: false
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await axiosClient.post('/auth/login', {
        login_account: formData.identifier,
        password: formData.password
      });

      localStorage.setItem('hotelify_token', response.data.token);
      localStorage.setItem('hotelify_user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('hotelify-auth-change'));
      navigate('/home');
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          'Cannot connect to the server. Please check that the backend is running.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-page" aria-label="Hotelify login">
      <Link className="login-home-link" to="/">
        Back to Home
      </Link>

      <div className="login-visual" aria-hidden="true">
        <img src={hotelLoginImage} alt="" />
      </div>

      <div className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-copy">
            <h1>Welcome Back to Hotelify</h1>
            <p>
              Sign in to manage reservations, track performance,
              and keep your operations running smoothly.
            </p>
          </div>

          <div className="login-fields">
            <label className="login-field">
              <span>Login Account</span>
              <input
                type="text"
                name="identifier"
                placeholder="Enter Login Account"
                autoComplete="off"
                value={formData.identifier}
                onChange={handleChange}
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
            </label>
          </div>

          <label className="remember-option">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
            />
            <span>Remember Me</span>
          </label>

          {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

          <div className="login-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login to Dashboard'}
            </button>

            <div className="register-prompt">
              <span>Don't have an account yet?</span>
              <Link to="/register">Register Now</Link>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
