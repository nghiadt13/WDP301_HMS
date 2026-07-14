const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Role = require('../models/role.model');
const User = require('../models/user.model');
const asyncHandler = require('../utils/async-handler');
const { verifyGoogleIdToken } = require('../utils/google-auth');
const { sendPasswordResetEmail } = require('../utils/mail.utils');
const { signAuthToken } = require('../utils/token');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim();
const normalizeLoginAccount = (value) => String(value || '').trim().toLowerCase();

const getAuthProviders = (user) => {
  const providers = Array.isArray(user?.auth_providers) && user.auth_providers.length > 0
    ? user.auth_providers
    : [user?.auth_provider || 'local'];

  return [...new Set(providers.filter(Boolean))];
};

const hasLocalPassword = (user) => {
  const passwordHash = String(user?.password_hash || '');

  return getAuthProviders(user).includes('local') && !passwordHash.startsWith('google:');
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getPasswordValidationErrors = (password) => {
  const value = typeof password === 'string' ? password : '';
  const errors = [];

  if (value.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(value)) {
    errors.push('Password must include at least 1 uppercase letter');
  }

  if (!/[a-z]/.test(value)) {
    errors.push('Password must include at least 1 lowercase letter');
  }

  if (!/\d/.test(value)) {
    errors.push('Password must include at least 1 number');
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push('Password must include at least 1 special character');
  }

  return errors;
};

const sendPasswordValidationError = (res, errors) => {
  return res.status(400).send({
    message: errors[0],
    errors
  });
};

const isValidLoginAccount = (value) => {
  return /^[a-z0-9._-]{4,30}$/.test(value);
};

const isTermsAccepted = (value) => {
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
};

const PASSWORD_RESET_EXPIRES_IN_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRES_IN_MINUTES || 30);
const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If the account exists, a password reset email has been sent.';

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const sendAuthResponse = (res, statusCode, user, role, message) => {
  const token = signAuthToken(user, role);

  res.status(statusCode).send({
    message,
    token,
    token_type: 'Bearer',
    expires_in: process.env.JWT_EXPIRES_IN || '7d',
    user: user.toSafeObject(role)
  });
};

const getCustomerRole = async () => {
  let role = await Role.findOne({
    name: { $regex: /^customer$/i }
  });

  if (!role) {
    role = await Role.create({
      name: 'Customer',
      permission_sets: ['room:view', 'reservation:create', 'reservation:self', 'service:request', 'feedback:create'],
      is_active: true
    });
  }

  if (!role.is_active) {
    const error = new Error('Customer role is not active');
    error.statusCode = 403;
    throw error;
  }

  return role;
};

const buildUniqueGoogleLoginAccount = async (email) => {
  const baseAccount =
    email
      .split('@')[0]
      .replace(/[^a-z0-9._-]/gi, '')
      .toLowerCase()
      .slice(0, 24) || 'google-user';
  let loginAccount = baseAccount;
  let suffix = 1;

  while (await User.exists({ login_account: loginAccount })) {
    loginAccount = `${baseAccount}${suffix}`.slice(0, 30);
    suffix += 1;
  }

  return loginAccount;
};

const register = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const loginAccount = normalizeLoginAccount(
    req.body.login_account || req.body.loginAccount || req.body.username || req.body.account
  );
  const fullName = normalizeText(req.body.full_name || req.body.fullName || req.body.name);
  const password = req.body.password;
  const confirmPassword = req.body.confirm_password || req.body.confirmPassword;
  const phoneNumber = normalizeText(req.body.phone_number || req.body.phoneNumber);
  const acceptedTerms = isTermsAccepted(
    req.body.accepted_terms || req.body.acceptedTerms || req.body.termsAccepted || req.body.agreeTerms
  );

  if (!fullName) {
    return res.status(400).send({ message: 'Full name is required' });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).send({ message: 'A valid email address is required' });
  }

  if (!loginAccount || !isValidLoginAccount(loginAccount)) {
    return res.status(400).send({
      message: 'Login account must be 4-30 characters and only contain letters, numbers, dots, underscores, or hyphens'
    });
  }

  const passwordErrors = getPasswordValidationErrors(password);
  if (passwordErrors.length > 0) {
    return sendPasswordValidationError(res, passwordErrors);
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).send({ message: 'Password confirmation does not match' });
  }

  if (!acceptedTerms) {
    return res.status(400).send({ message: 'You must agree to the terms and conditions' });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { login_account: loginAccount }]
  });

  if (existingUser) {
    const duplicatedField = existingUser.email === email ? 'Email address' : 'Login account';
    return res.status(409).send({ message: `${duplicatedField} is already registered` });
  }

  const customerRole = await getCustomerRole();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    role_id: customerRole._id,
    email,
    login_account: loginAccount,
    password_hash: passwordHash,
    full_name: fullName,
    phone_number: phoneNumber,
    status: 'active',
    auth_provider: 'local',
    auth_providers: ['local'],
    email_verified: false,
    accepted_terms_at: new Date()
  });

  sendAuthResponse(res, 201, user, customerRole, 'Account created successfully');
});

const login = asyncHandler(async (req, res) => {
  const identifier = normalizeLoginAccount(
    req.body.login_account || req.body.loginAccount || req.body.username || req.body.account || req.body.email
  );
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).send({ message: 'Login account or email and password are required' });
  }

  const user = await User.findOne({
    $or: [{ login_account: identifier }, { email: identifier }]
  }).populate('role_id');
  if (!user) {
    return res.status(401).send({ message: 'Invalid email or password' });
  }

  if (!hasLocalPassword(user)) {
    return res.status(400).send({ message: 'Please sign in with Google for this account' });
  }

  if (user.status !== 'active') {
    return res.status(403).send({ message: 'This account is not active' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).send({ message: 'Invalid email or password' });
  }

  const role = user.role_id;
  if (!role || role.is_active === false) {
    return res.status(403).send({ message: 'This account role is not active' });
  }

  sendAuthResponse(res, 200, user, role, 'Login successfully');
});

const googleLogin = asyncHandler(async (req, res) => {
  const payload = await verifyGoogleIdToken(req.body.credential || req.body.idToken);
  const email = normalizeEmail(payload.email);
  const fullName = normalizeText(payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' '));

  if (!email || !payload.email_verified) {
    return res.status(401).send({ message: 'Google account email is not verified' });
  }

  const customerRole = await getCustomerRole();
  let user = await User.findOne({ google_id: payload.sub }).populate('role_id');

  if (!user) {
    user = await User.findOne({ email }).populate('role_id');
  }

  if (user) {
    if (user.status !== 'active') {
      return res.status(403).send({ message: 'This account is not active' });
    }

    if (user.google_id && user.google_id !== payload.sub) {
      return res.status(409).send({
        message: 'This email address is already linked to another Google account'
      });
    }

    const providers = new Set(getAuthProviders(user));
    providers.add('google');
    if (hasLocalPassword(user)) {
      providers.add('local');
    }

    user.google_id = payload.sub;
    user.auth_provider = providers.has('local') ? 'local' : 'google';
    user.auth_providers = Array.from(providers);
    user.email_verified = true;
    user.avatar = user.avatar || payload.picture || '';
    user.full_name = user.full_name || fullName || email;
    await user.save();
  } else {
    const loginAccount = await buildUniqueGoogleLoginAccount(email);

    user = await User.create({
      role_id: customerRole._id,
      email,
      login_account: loginAccount,
      password_hash: `google:${payload.sub}`,
      full_name: fullName || email,
      avatar: payload.picture || '',
      status: 'active',
      auth_provider: 'google',
      auth_providers: ['google'],
      google_id: payload.sub,
      email_verified: true,
      accepted_terms_at: new Date()
    });
    user.role_id = customerRole;
  }

  const role = user.role_id?._id ? user.role_id : customerRole;
  if (!role || role.is_active === false) {
    return res.status(403).send({ message: 'This account role is not active' });
  }

  sendAuthResponse(res, 200, user, role, 'Login with Google successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = req.body.current_password || req.body.currentPassword;
  const newPassword = req.body.new_password || req.body.newPassword;
  const confirmPassword = req.body.confirm_password || req.body.confirmPassword;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).send({ message: 'Current password, new password, and confirmation are required' });
  }

  const passwordErrors = getPasswordValidationErrors(newPassword);
  if (passwordErrors.length > 0) {
    return sendPasswordValidationError(
      res,
      passwordErrors.map((error) => error.replace(/^Password/, 'New password'))
    );
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).send({ message: 'New password confirmation does not match' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).send({ message: 'New password must be different from current password' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).send({ message: 'Account not found' });
  }

  if (!hasLocalPassword(user)) {
    return res.status(400).send({ message: 'This account uses Google sign-in and does not have a local password' });
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    return res.status(401).send({ message: 'Current password is incorrect' });
  }

  user.password_hash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.send({ message: 'Password changed successfully' });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const identifier = normalizeLoginAccount(
    req.body.identifier || req.body.login_account || req.body.loginAccount || req.body.username || req.body.email
  );

  if (!identifier) {
    return res.status(400).send({ message: 'Email or login account is required' });
  }

  const user = await User.findOne({
    $or: [{ login_account: identifier }, { email: identifier }]
  });

  if (!user || user.status !== 'active' || !hasLocalPassword(user)) {
    return res.send({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  user.password_reset_token_hash = hashResetToken(resetToken);
  user.password_reset_expires_at = new Date(Date.now() + PASSWORD_RESET_EXPIRES_IN_MINUTES * 60 * 1000);
  await user.save();

  try {
    await sendPasswordResetEmail({
      to: user.email,
      fullName: user.full_name,
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_EXPIRES_IN_MINUTES
    });
  } catch (error) {
    user.password_reset_token_hash = '';
    user.password_reset_expires_at = null;
    await user.save();
    throw error;
  }

  res.send({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = normalizeText(req.body.token || req.query.token);
  const newPassword = req.body.password || req.body.new_password || req.body.newPassword;
  const confirmPassword = req.body.confirm_password || req.body.confirmPassword;

  if (!token) {
    return res.status(400).send({ message: 'Reset token is required' });
  }

  const passwordErrors = getPasswordValidationErrors(newPassword);
  if (passwordErrors.length > 0) {
    return sendPasswordValidationError(res, passwordErrors);
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).send({ message: 'Password confirmation does not match' });
  }

  const user = await User.findOne({
    password_reset_token_hash: hashResetToken(token),
    password_reset_expires_at: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).send({ message: 'Reset link is invalid or expired' });
  }

  if (user.status !== 'active') {
    return res.status(403).send({ message: 'This account is not active' });
  }

  user.password_hash = await bcrypt.hash(newPassword, 10);
  user.password_reset_token_hash = '';
  user.password_reset_expires_at = null;
  await user.save();

  res.send({ message: 'Password reset successfully' });
});

const me = asyncHandler(async (req, res) => {
  res.send({
    user: req.user.toSafeObject(req.role)
  });
});

module.exports = {
  changePassword,
  googleLogin,
  login,
  me,
  register,
  requestPasswordReset,
  resetPassword
};
