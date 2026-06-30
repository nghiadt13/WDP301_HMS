const MinibarItem = require('../models/minibarItem.model');

const listMinibarItems = (filter = {}) => MinibarItem.find(filter).sort({ createdAt: -1 });

const createMinibarItem = (payload) => MinibarItem.create(payload);

const updateMinibarItem = (minibarItemId, payload) =>
  MinibarItem.findByIdAndUpdate(minibarItemId, payload, { new: true, runValidators: true });

const deactivateMinibarItem = (minibarItemId) =>
  MinibarItem.findByIdAndUpdate(
    minibarItemId,
    { is_active: false },
    { new: true, runValidators: true }
  );

module.exports = {
  createMinibarItem,
  deactivateMinibarItem,
  listMinibarItems,
  updateMinibarItem
};
