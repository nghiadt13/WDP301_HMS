import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import axiosClient from '../api/axiosClient';
import registerResortImage from '../assets/register-resort.png';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    login_account: '',
    accepted_terms: false
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
      const response = await axiosClient.post('/auth/register', formData);

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
    <section className="register-page" aria-label="Hotelify register">
      <div className="register-hero" aria-hidden="true">
        <img src={registerResortImage} alt="" />
      </div>

      <div className="register-content">
        <div className="register-copy">
          <h1>Create Your Hotelify Account</h1>
          <p>
            Join Hotelify to streamline your hotel management, track performance,
            and provide exceptional guest experiences.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="register-grid">
            <label className="register-field">
              <span>Full Name</span>
              <input
                type="text"
                name="full_name"
                placeholder="Enter Your Name"
                value={formData.full_name}
                onChange={handleChange}
              />
            </label>

            <label className="register-field">
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                placeholder="Enter Email Address"
                value={formData.email}
                onChange={handleChange}
              />
            </label>

            <label className="register-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>

            <label className="register-field">
              <span>Confirm Password</span>
              <input
                type="password"
                name="confirm_password"
                placeholder="Enter Confirm Password"
                value={formData.confirm_password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </label>

            <label className="register-field register-field-wide">
              <span>Login Account</span>
              <input
                type="text"
                name="login_account"
                placeholder="Enter Login Account"
                value={formData.login_account}
                onChange={handleChange}
                autoComplete="off"
              />
            </label>
          </div>

          <label className="terms-option">
            <input
              type="checkbox"
              name="accepted_terms"
              checked={formData.accepted_terms}
              onChange={handleChange}
            />
            <span>I agree to the Terms & Conditions</span>
          </label>

          {errorMessage ? <p className="register-error">{errorMessage}</p> : null}

          <div className="register-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>

            <div className="login-prompt">
              <span>Already have an account?</span>
              <Link to="/login">Login here</Link>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RegisterPage;
