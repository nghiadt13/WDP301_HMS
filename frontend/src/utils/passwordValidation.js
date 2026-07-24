export const getPasswordValidationErrors = (password, label = 'Password') => {
  const value = typeof password === 'string' ? password : '';
  const errors = [];

  if (value.length < 8) {
    errors.push(`${label} must be at least 8 characters long`);
  }

  if (!/[A-Z]/.test(value)) {
    errors.push(`${label} must include at least 1 uppercase letter`);
  }

  if (!/[a-z]/.test(value)) {
    errors.push(`${label} must include at least 1 lowercase letter`);
  }

  if (!/\d/.test(value)) {
    errors.push(`${label} must include at least 1 number`);
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push(`${label} must include at least 1 special character`);
  }

  return errors;
};

export const getApiValidationErrors = (error) => {
  const errors = error.response?.data?.errors;
  return Array.isArray(errors) && errors.length > 0 ? errors : [];
};
