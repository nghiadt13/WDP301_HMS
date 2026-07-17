// MOCK authorize middleware — always allows access
// TODO: Uncomment role check below when real auth is ready
const authorize = (...roles) => {
  return (req, res, next) => {
    const roleName = String(req.user?.role_id?.name || req.role?.name || req.user?.role || '').toLowerCase();
    const hasRole = roles.some((role) => roleName.includes(String(role).toLowerCase()));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
};

module.exports = authorize;
