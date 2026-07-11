const Role = require('../../../models/role.model');
const asyncHandler = require('../../../utils/async-handler');

const roleService = {
  async getAllRoles(query) {
    const filter = {};
    if (query.keyword) {
      filter.name = { $regex: query.keyword, $options: 'i' };
    }
    
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Role.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Role.countDocuments(filter)
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getRoleById(id) {
    const role = await Role.findById(id);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }
    return role;
  },

  async createRole(data) {
    const existing = await Role.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
    if (existing) {
      const error = new Error('Role name already exists');
      error.statusCode = 400;
      throw error;
    }

    const role = await Role.create({
      name: data.name,
      permission_sets: data.permission_sets || [],
      is_active: data.is_active !== undefined ? data.is_active : true
    });
    return role;
  },

  async updateRole(id, data) {
    const role = await Role.findById(id);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name.toLowerCase() !== role.name.toLowerCase()) {
      const existing = await Role.findOne({ name: { $regex: new RegExp(`^${data.name}$`, 'i') } });
      if (existing) {
        const error = new Error('Role name already exists');
        error.statusCode = 400;
        throw error;
      }
      role.name = data.name;
    }

    if (data.permission_sets !== undefined) {
      role.permission_sets = data.permission_sets;
    }
    
    if (data.is_active !== undefined) {
      role.is_active = data.is_active;
    }

    await role.save();
    return role;
  },

  async deleteRole(id) {
    const role = await Role.findById(id);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    // Usually we just deactivate, but UC says delete/deactivate. We will deactivate for safety.
    role.is_active = false;
    await role.save();
    return role;
  }
};

module.exports = roleService;
