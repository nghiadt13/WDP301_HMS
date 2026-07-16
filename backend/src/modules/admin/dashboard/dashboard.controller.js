const SecurityLog = require('../../../models/security-log.model');
const asyncHandler = require('../../../utils/async-handler');

const getDashboardStats = asyncHandler(async (req, res) => {
  // Count security alerts in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const securityAlertsCount = await SecurityLog.countDocuments({
    createdAt: { $gte: oneDayAgo },
    event_type: { $in: ['FAILED_LOGIN', 'UNAUTHORIZED_ACCESS', 'SYSTEM_ERROR'] }
  });

  res.send({
    security_alerts_24h: securityAlertsCount
  });
});

module.exports = {
  getDashboardStats
};
