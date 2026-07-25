const HotelPolicy = require('../../../models/hotelPolicy.model');

const defaultPolicies = [
  {
    title: 'Thời gian nhận và trả phòng',
    category: 'Lưu trú',
    content: 'Khách nhận phòng từ 11:00 và trả phòng trước 12:00. Nếu cần nhận phòng sớm hoặc trả phòng muộn, vui lòng liên hệ lễ tân để được hỗ trợ theo tình trạng phòng thực tế.',
    display_order: 1,
  },
  {
    title: 'Thanh toán khi đặt phòng',
    category: 'Thanh toán',
    content: 'Khách thanh toán 100% tiền phòng tại thời điểm đặt phòng để xác nhận booking. Booking chỉ được xem là thành công sau khi hệ thống ghi nhận thanh toán đầy đủ.',
    display_order: 2,
  },
  {
    title: 'Hủy và thay đổi booking',
    category: 'Đặt phòng',
    content: 'Khách có thể yêu cầu hủy hoặc thay đổi booking khi booking còn trong trạng thái cho phép xử lý. Các yêu cầu phát sinh sát ngày nhận phòng sẽ được lễ tân xác nhận theo chính sách vận hành của khách sạn.',
    display_order: 3,
  },
  {
    title: 'Giấy tờ khi nhận phòng',
    category: 'Lưu trú',
    content: 'Khách cần xuất trình giấy tờ tùy thân hợp lệ khi nhận phòng. Thông tin người lưu trú phải khớp với thông tin booking hoặc được cập nhật với lễ tân trước khi nhận phòng.',
    display_order: 4,
  },
  {
    title: 'Bảo quản tài sản và trang thiết bị',
    category: 'Lưu trú',
    content: 'Khách vui lòng bảo quản tài sản cá nhân và sử dụng trang thiết bị trong phòng đúng quy định. Hư hỏng hoặc mất mát do sử dụng sai cách có thể phát sinh phí bồi thường.',
    display_order: 5,
  },
  {
    title: 'Góp ý và phản hồi',
    category: 'Chăm sóc khách hàng',
    content: 'Khách có booking đã thanh toán có thể gửi góp ý về kỳ lưu trú. Quản lý khách sạn sẽ tiếp nhận và phản hồi góp ý để theo dõi chất lượng dịch vụ.',
    display_order: 6,
  },
];

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const ensureDefaultPolicies = async () => {
  const count = await HotelPolicy.countDocuments();
  if (count === 0) {
    await HotelPolicy.insertMany(defaultPolicies);
  }
};

const normalizePolicyPayload = (data) => {
  const title = String(data.title || '').trim();
  const category = String(data.category || '').trim();
  const content = String(data.content || '').trim();

  if (title.length < 3) throw createHttpError('Vui lòng nhập tiêu đề chính sách.');
  if (category.length < 2) throw createHttpError('Vui lòng nhập nhóm chính sách.');
  if (content.length < 10) throw createHttpError('Nội dung chính sách phải có ít nhất 10 ký tự.');

  return {
    title,
    category,
    content,
    display_order: Number(data.display_order || data.displayOrder || 999),
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : data.isActive !== undefined ? Boolean(data.isActive) : true,
  };
};

const policyService = {
  async listPolicies({ activeOnly = false } = {}) {
    await ensureDefaultPolicies();
    const filter = activeOnly ? { is_active: { $ne: false } } : {};
    return HotelPolicy.find(filter).sort({ display_order: 1, createdAt: 1 }).lean();
  },

  async createPolicy(data) {
    return HotelPolicy.create(normalizePolicyPayload(data));
  },

  async updatePolicy(id, data) {
    const policy = await HotelPolicy.findByIdAndUpdate(id, normalizePolicyPayload(data), { new: true, runValidators: true });
    if (!policy) throw createHttpError('Không tìm thấy chính sách.', 404);
    return policy;
  },

  async deletePolicy(id) {
    const policy = await HotelPolicy.findByIdAndDelete(id);
    if (!policy) throw createHttpError('Không tìm thấy chính sách.', 404);
    return policy;
  },
};

module.exports = policyService;
