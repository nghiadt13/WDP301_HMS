const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }

  return process.env.JWT_SECRET;
};

const signAuthToken = (user, role, sessionId) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role_id: user.role_id.toString(),
      role_name: role?.name || null,
      session_id: sessionId || null
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = {
  signAuthToken
};
