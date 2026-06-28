// MOCK auth middleware — auto-attaches manager user
// TODO: Replace with real JWT verification when login feature is ready
const auth = (req, res, next) => {
  req.user = {
    id: 'mock-manager-id',
    role: 'manager',
    email: 'manager@hotel.com',
  };
  next();
};

module.exports = auth;
