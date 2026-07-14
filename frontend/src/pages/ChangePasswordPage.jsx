import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import axiosClient from '../api/axiosClient';
import PasswordInput from '../components/PasswordInput';
import { getApiValidationErrors, getPasswordValidationErrors } from '../utils/passwordValidation';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
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
    setValidationErrors([]);

    const passwordErrors = getPasswordValidationErrors(formData.new_password, 'New password');
    if (passwordErrors.length > 0) {
      setValidationErrors(passwordErrors);
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
      const apiValidationErrors = getApiValidationErrors(error);
      if (apiValidationErrors.length > 0) {
        setValidationErrors(apiValidationErrors);
        return;
      }

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
            <PasswordInput
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Enter current password"
            />
          </label>

          <label>
            <span>New Password</span>
            <PasswordInput
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Enter new password"
            />
            <small className="password-requirement">
              At least 8 characters with uppercase, lowercase, number, and special character.
            </small>
          </label>

          <label>
            <span>Confirm New Password</span>
            <PasswordInput
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Re-enter new password"
            />
          </label>

          {message ? <p className="change-password-message">{message}</p> : null}
          {errorMessage ? <p className="change-password-error">{errorMessage}</p> : null}
          {validationErrors.length > 0 ? (
            <ul className="password-error-list">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}

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
