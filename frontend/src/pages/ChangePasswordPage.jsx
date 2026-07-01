import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import axiosClient from '../api/axiosClient';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('hotelify_token')) {
      navigate('/login');
    }
  }, [navigate]);

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

    if (formData.new_password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setErrorMessage('New password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosClient.patch('/auth/change-password', formData);
      setMessage(response.data.message || 'Password changed successfully.');
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Cannot change password right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="change-password-page" aria-label="Change password">
      <div className="change-password-card">
        <header>
          <span>Hotelify Account</span>
          <h1>Change Password</h1>
          <p>Update your local sign-in password to keep your account secure.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <label>
            <span>Current Password</span>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter current password"
            />
          </label>

          <label>
            <span>New Password</span>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Enter new password"
            />
          </label>

          <label>
            <span>Confirm New Password</span>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Re-enter new password"
            />
          </label>

          {message ? <p className="change-password-message">{message}</p> : null}
          {errorMessage ? <p className="change-password-error">{errorMessage}</p> : null}

          <div className="change-password-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
            <Link to="/profile">Back to Profile</Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ChangePasswordPage;
