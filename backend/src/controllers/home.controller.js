const homeService = require('../services/home.service');

const homeController = {
  getHomePage(req, res, next) {
    return homeService.getHomePage(req, res, next);
  }
};

module.exports = homeController;
