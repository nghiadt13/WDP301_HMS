const StaffMember = require('../models/staffMember.model');

const mockStaffMembers = [
  { _id: 'staff-housekeeping-01', full_name: 'Nguyen Thi Hoa', role: 'housekeeping', is_active: true },
  { _id: 'staff-housekeeping-02', full_name: 'Tran Van Nam', role: 'housekeeping', is_active: true },
  { _id: 'staff-technical-01', full_name: 'Le Minh Duc', role: 'technical', is_active: true },
  { _id: 'staff-technical-02', full_name: 'Pham Quang Huy', role: 'technical', is_active: true }
];

const listStaffMembers = async (query = {}) => {
  const filter = { is_active: true };

  if (query.role) {
    filter.role = query.role;
  }

  const staffMembers = await StaffMember.find(filter).sort({ full_name: 1 }).lean();

  if (staffMembers.length) {
    return staffMembers;
  }

  return mockStaffMembers.filter((staffMember) => !query.role || staffMember.role === query.role);
};

const getStaffMemberById = async (staffMemberId) => {
  const mockStaffMember = mockStaffMembers.find((staffMember) => staffMember._id === staffMemberId);

  if (mockStaffMember) {
    return mockStaffMember;
  }

  return StaffMember.findById(staffMemberId).lean();
};

module.exports = {
  getStaffMemberById,
  listStaffMembers
};
