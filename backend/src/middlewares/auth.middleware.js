const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const asyncHandler = require('../utils/async-handler');

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).send({ message: 'Authentication token is required' });
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).send({ message: 'Invalid or expired authentication token' });
  }

  const user = await User.findById(payload.sub).populate('role_id');
  if (!user || user.status !== 'active') {
    return res.status(401).send({ message: 'Authenticated user is not available' });
  }

  req.user = user;
  req.role = user.role_id;
  next();
});

module.exports = authMiddleware;
