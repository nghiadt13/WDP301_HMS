const profileService = require('../services/profile.service');

const profileController = {
  getProfileDashboard(req, res, next) {
    return profileService.getProfileDashboard(req, res, next);
  },

  updateProfile(req, res, next) {
    return profileService.updateProfile(req, res, next);
  }
};

module.exports = profileController;
