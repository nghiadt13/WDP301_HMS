const accountService = require('./account.service');
const asyncHandler = require('../../../utils/async-handler');

const accountController = {
  getAll: asyncHandler(async (req, res) => {
    const result = await accountService.getAllAccounts(req.query);
    res.send(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await accountService.getAccountById(req.params.id);
    res.send(result);
  }),

  create: asyncHandler(async (req, res) => {
    const result = await accountService.createAccount(req.body);
    res.status(201).send(result);
  }),

  update: asyncHandler(async (req, res) => {
    const result = await accountService.updateAccount(req.params.id, req.body);
    res.send(result);
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const result = await accountService.resetPassword(req.params.id, req.body.new_password);
    res.send(result);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await accountService.deleteAccount(req.params.id);
    res.send(result);
  })
};

module.exports = accountController;
