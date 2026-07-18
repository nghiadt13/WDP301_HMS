const roleService = require('./role.service');
const asyncHandler = require('../../../utils/async-handler');

const roleController = {
  getAll: asyncHandler(async (req, res) => {
    const result = await roleService.getAllRoles(req.query);
    res.send(result);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await roleService.getRoleById(req.params.id);
    res.send(result);
  }),

  create: asyncHandler(async (req, res) => {
    const result = await roleService.createRole(req.body);
    res.status(201).send(result);
  }),

  update: asyncHandler(async (req, res) => {
    const result = await roleService.updateRole(req.params.id, req.body);
    res.send(result);
  }),

  remove: asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.params.id);
    res.status(204).send();
  })
};

module.exports = roleController;
