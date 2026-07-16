const authService = require('../services/auth.service');

const authController = {
  changePassword(req, res, next) {
    return authService.changePassword(req, res, next);
  },

  googleLogin(req, res, next) {
    return authService.googleLogin(req, res, next);
  },

  login(req, res, next) {
    return authService.login(req, res, next);
  },

  me(req, res, next) {
    return authService.me(req, res, next);
  },

  register(req, res, next) {
    return authService.register(req, res, next);
  },

  recentSessions(req, res, next) {
    return authService.recentSessions(req, res, next);
  },

  revokeSession(req, res, next) {
    return authService.revokeSession(req, res, next);
  },

  logout(req, res, next) {
    return authService.logout(req, res, next);
  }
};

module.exports = authController;
