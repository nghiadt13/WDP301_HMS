const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const Role = require('../models/role.model');
const User = require('../models/user.model');
const SecurityLog = require('../models/security-log.model');
const asyncHandler = require('../utils/async-handler');
const { verifyGoogleIdToken } = require('../utils/google-auth');
const { signAuthToken } = require('../utils/token');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizeText = (value) => String(value || '').trim();
const normalizeLoginAccount = (value) => String(value || '').trim().toLowerCase();

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isStrongEnoughPassword = (password) => {
  return typeof password === 'string' && password.length >= 8;
};

const isValidLoginAccount = (value) => {
  return /^[a-z0-9._-]{4,30}$/.test(value);
};

const isTermsAccepted = (value) => {
  return value === true || value === 'true' || value === 'on' || value === 1 || value === '1';
};

const getClientIp = (req) => {
  let ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'Unknown IP';
  if (ip === '::1') return '127.0.0.1';
  if (ip.includes('::ffff:')) return ip.split(':').pop();
  return ip.split(',')[0].trim();
};

const sendAuthResponse = (res, statusCode, user, role, message, sessionId) => {
  const token = signAuthToken(user, role, sessionId);

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

  if (!isStrongEnoughPassword(password)) {
    return res.status(400).send({ message: 'Password must be at least 8 characters long' });
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
    email_verified: false,
    accepted_terms_at: new Date()
  });

  const sessionId = crypto.randomUUID();

  await SecurityLog.create({
    event_type: 'SUCCESSFUL_LOGIN',
    ip_address: getClientIp(req),
    target_account: user.login_account,
    session_id: sessionId,
    details: req.headers['user-agent'] || 'Unknown Device'
  }).catch(err => console.error('Failed to write security log:', err));

  sendAuthResponse(res, 201, user, customerRole, 'Account created successfully', sessionId);
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

  if (user.auth_provider !== 'local') {
    return res.status(400).send({ message: `Please sign in with ${user.auth_provider}` });
  }

  if (user.status !== 'active') {
    return res.status(403).send({ message: 'This account is not active' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    await SecurityLog.create({
      event_type: 'FAILED_LOGIN',
      ip_address: getClientIp(req),
      target_account: identifier,
      details: 'Invalid password provided'
    }).catch(err => console.error('Failed to write security log:', err));
    return res.status(401).send({ message: 'Invalid email or password' });
  }

  const role = user.role_id;
  if (!role || role.is_active === false) {
    return res.status(403).send({ message: 'This account role is not active' });
  }

  const sessionId = crypto.randomUUID();

  // Log successful login
  await SecurityLog.create({
    event_type: 'SUCCESSFUL_LOGIN',
    ip_address: getClientIp(req),
    target_account: user.login_account,
    session_id: sessionId,
    details: req.headers['user-agent'] || 'Unknown Device'
  }).catch(err => console.error('Failed to write security log:', err));

  sendAuthResponse(res, 200, user, role, 'Login successfully', sessionId);
});

const googleLogin = asyncHandler(async (req, res) => {
  const payload = await verifyGoogleIdToken(req.body.credential || req.body.idToken);
  const email = normalizeEmail(payload.email);
  const fullName = normalizeText(payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' '));

  if (!email || !payload.email_verified) {
    return res.status(401).send({ message: 'Google account email is not verified' });
  }

  const customerRole = await getCustomerRole();
  let user = await User.findOne({
    $or: [{ email }, { google_id: payload.sub }]
  }).populate('role_id');

  if (user) {
    if (user.status !== 'active') {
      return res.status(403).send({ message: 'This account is not active' });
    }

    user.google_id = user.google_id || payload.sub;
    user.auth_provider = user.auth_provider === 'local' ? 'local' : 'google';
    user.email_verified = true;
    user.avatar = user.avatar || payload.picture || '';
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

  const sessionId = crypto.randomUUID();

  // Log successful google login
  await SecurityLog.create({
    event_type: 'SUCCESSFUL_LOGIN',
    ip_address: getClientIp(req),
    target_account: user.login_account,
    session_id: sessionId,
    details: req.headers['user-agent'] || 'Unknown Device'
  }).catch(err => console.error('Failed to write security log:', err));

  sendAuthResponse(res, 200, user, role, 'Login with Google successfully', sessionId);
});

const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = req.body.current_password || req.body.currentPassword;
  const newPassword = req.body.new_password || req.body.newPassword;
  const confirmPassword = req.body.confirm_password || req.body.confirmPassword;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).send({ message: 'Current password, new password, and confirmation are required' });
  }

  if (!isStrongEnoughPassword(newPassword)) {
    return res.status(400).send({ message: 'New password must be at least 8 characters long' });
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

  if (user.auth_provider === 'google' || String(user.password_hash || '').startsWith('google:')) {
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

const me = asyncHandler(async (req, res) => {
  res.send({
    user: req.user.toSafeObject(req.role)
  });
});

const recentSessions = asyncHandler(async (req, res) => {
  const sessions = await SecurityLog.find({
    target_account: req.user.login_account,
    event_type: 'SUCCESSFUL_LOGIN',
    is_revoked: false
  })
    .sort({ createdAt: -1 })
    .limit(10);

  res.send({
    message: 'Recent sessions retrieved successfully',
    data: sessions,
    current_session_id: req.user_session_id
  });
});

const logout = asyncHandler(async (req, res) => {
  const sessionId = req.user_session_id;
  if (sessionId) {
    await SecurityLog.updateMany({ session_id: sessionId }, { is_revoked: true });
  }
  res.send({ message: 'Logged out successfully' });
});

const revokeSession = asyncHandler(async (req, res) => {
  const logId = req.params.id;
  const log = await SecurityLog.findOne({ _id: logId, target_account: req.user.login_account });
  
  if (!log) {
    return res.status(404).send({ message: 'Session not found' });
  }
  
  log.is_revoked = true;
  await log.save();
  
  res.send({ message: 'Session revoked successfully' });
});

module.exports = {
  changePassword,
  googleLogin,
  login,
  logout,
  me,
  recentSessions,
  revokeSession,
  register
};
