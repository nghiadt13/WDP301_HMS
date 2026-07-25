const policyService = require('./policy.service');

const sendError = (res, err) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

const policyController = {
  async listPublicPolicies(req, res) {
    try {
      const data = await policyService.listPolicies({ activeOnly: true });
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async listManagerPolicies(req, res) {
    try {
      const data = await policyService.listPolicies();
      res.status(200).json({ success: true, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async createPolicy(req, res) {
    try {
      const data = await policyService.createPolicy(req.body);
      res.status(201).json({ success: true, data, message: 'Policy created successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async updatePolicy(req, res) {
    try {
      const data = await policyService.updatePolicy(req.params.policyId, req.body);
      res.status(200).json({ success: true, data, message: 'Policy updated successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },

  async deletePolicy(req, res) {
    try {
      const data = await policyService.deletePolicy(req.params.policyId);
      res.status(200).json({ success: true, data, message: 'Policy deleted successfully' });
    } catch (err) {
      sendError(res, err);
    }
  },
};

module.exports = policyController;
