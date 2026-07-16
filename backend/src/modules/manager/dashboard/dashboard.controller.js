const dashboardService = require('./dashboard.service');

const getDashboardStats = async (req, res, next) => {
  try {
    const filter = req.query.filter || 'week';
    const stats = await dashboardService.getDashboardStats(filter);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
