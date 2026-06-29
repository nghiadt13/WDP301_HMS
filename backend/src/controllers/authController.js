const bcrypt = require('bcryptjs');

const Role = require('../models/Role');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
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

  if (user.auth_provider !== 'local') {
    return res.status(400).send({ message: `Please sign in with ${user.auth_provider}` });
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

const me = asyncHandler(async (req, res) => {
  res.send({
    user: req.user.toSafeObject(req.role)
  });
});

module.exports = {
  login,
  me,
  register
};
