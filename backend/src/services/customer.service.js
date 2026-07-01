const mongoose = require('mongoose');

const CustomerFeedback = require('../models/customerFeedback.model');
const CustomerServiceRequest = require('../models/customerServiceRequest.model');
const HotelService = require('../models/hotelService.model');
const asyncHandler = require('../utils/async-handler');

const { ObjectId } = mongoose.Types;

const serviceFallbacks = [
  {
    id: 'room-dining',
    name: 'Dịch vụ ăn uống tại phòng',
    category: 'Ăn uống',
    description: 'Đặt món ăn, đồ ăn nhẹ và đồ uống giao trực tiếp đến phòng.',
    price: 0,
    available_time: '10:00 - 22:00',
    image_key: 'dining',
    is_active: true
  },
  {
    id: 'housekeeping-request',
    name: 'Yêu cầu dọn phòng',
    category: 'Dọn phòng',
    description: 'Yêu cầu dọn phòng, thay khăn, thay ga giường hoặc bổ sung tiện nghi.',
    price: 0,
    available_time: '24/7',
    image_key: 'housekeeping',
    is_active: true
  },
  {
    id: 'laundry-pressing',
    name: 'Giặt ủi',
    category: 'Giặt ủi',
    description: 'Dịch vụ giặt, sấy, ủi và giặt nhanh cho khách đang lưu trú.',
    price: 50000,
    available_time: '08:00 - 20:00',
    image_key: 'laundry',
    is_active: true
  },
  {
    id: 'maintenance-support',
    name: 'Hỗ trợ kỹ thuật',
    category: 'Kỹ thuật',
    description: 'Báo sự cố điều hòa, đèn, nước, két an toàn hoặc thiết bị trong phòng.',
    price: 0,
    available_time: '24/7',
    image_key: 'maintenance',
    is_active: true
  },
  {
    id: 'amenities-request',
    name: 'Yêu cầu vật dụng phòng',
    category: 'Vật dụng phòng',
    description: 'Yêu cầu thêm nước, đồ vệ sinh cá nhân, gối, chăn, dép hoặc bộ chuyển đổi.',
    price: 0,
    available_time: '24/7',
    image_key: 'amenities',
    is_active: true
  },
  {
    id: 'airport-transfer',
    name: 'Đưa đón sân bay',
    category: 'Di chuyển',
    description: 'Đặt dịch vụ đưa đón riêng giữa khách sạn và sân bay.',
    price: 450000,
    available_time: 'Theo yêu cầu',
    image_key: 'transport',
    is_active: true
  },
  {
    id: 'foot-soak-therapy',
    name: 'Ngâm chân thư giãn',
    category: 'Thư giãn & Spa',
    description: 'Thư giãn với dịch vụ ngâm chân thảo mộc sau khi di chuyển hoặc một ngày dài.',
    price: 120000,
    available_time: '14:00 - 22:00',
    image_key: 'spa',
    is_active: true
  },
  {
    id: 'relaxing-massage',
    name: 'Mát xa thư giãn',
    category: 'Thư giãn & Spa',
    description: 'Đặt lịch mát xa toàn thân thư giãn do nhân viên spa của khách sạn phục vụ.',
    price: 350000,
    available_time: '14:00 - 22:00',
    image_key: 'spa',
    is_active: true
  }
];

const createHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapHotelService = (service) => ({
  id: String(service._id || service.id),
  name: service.name,
  category: service.category,
  description: service.description || '',
  price: Number(service.price || 0),
  availableTime: service.available_time || '',
  imageUrl: service.image_url || '',
  imageKey: service.image_key || '',
  isActive: service.is_active !== false
});

const mapServiceRequest = (request) => ({
  id: String(request._id),
  serviceId: request.hotel_service_id ? String(request.hotel_service_id) : request.service_code || '',
  serviceName: request.service_name,
  serviceCategory: request.service_category || '',
  roomNumber: request.room_number,
  note: request.note || '',
  status: request.status,
  requestedAt: request.requested_at,
  canceledAt: request.canceled_at,
  handledAt: request.handled_at
});

const mapFeedbackHistoryItem = (historyItem) => ({
  roomNumber: historyItem.room_number || '',
  rating: Number(historyItem.rating || 0),
  feedbackText: historyItem.feedback_text || '',
  responseText: historyItem.response_text || '',
  status: historyItem.status || 'submitted',
  submittedAt: historyItem.submitted_at || null,
  respondedAt: historyItem.responded_at || null,
  savedAt: historyItem.saved_at || null
});

const mapCustomerFeedback = (feedback) => ({
  id: String(feedback._id),
  customerName: feedback.customer_name,
  customerEmail: feedback.customer_email,
  roomNumber: feedback.room_number || '',
  rating: Number(feedback.rating || 0),
  feedbackText: feedback.feedback_text,
  responseText: feedback.response_text || '',
  status: feedback.status,
  submittedAt: feedback.submitted_at,
  respondedAt: feedback.responded_at || null,
  history: Array.isArray(feedback.feedback_history) ? feedback.feedback_history.map(mapFeedbackHistoryItem) : []
});

const findServiceById = async (serviceId) => {
  let service = serviceFallbacks.find((item) => item.id === serviceId);

  if (!service && ObjectId.isValid(serviceId)) {
    service = await HotelService.findOne({
      _id: new ObjectId(serviceId),
      is_active: { $ne: false }
    }).lean();
  }

  return service;
};

const normalizeFeedbackPayload = (body, user) => {
  const customerName = String(user?.full_name || body.customerName || body.customer_name || '').trim();
  const customerEmail = String(user?.email || body.customerEmail || body.customer_email || '').trim();
  const roomNumber = String(body.roomNumber || body.room_number || '').trim();
  const feedbackText = String(body.feedbackText || body.feedback_text || '').trim();
  const rating = Number.parseInt(body.rating, 10);

  if (customerName.length < 2) {
    throw createHttpError('Tên khách hàng phải có ít nhất 2 ký tự.');
  }

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw createHttpError('Email khách hàng không hợp lệ.');
  }

  if (roomNumber && !/^[A-Za-z0-9-]{1,12}$/.test(roomNumber)) {
    throw createHttpError('Số phòng không hợp lệ.');
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createHttpError('Đánh giá phải từ 1 đến 5 sao.');
  }

  if (feedbackText.length < 3) {
    throw createHttpError('Nội dung góp ý phải có ít nhất 3 ký tự.');
  }

  if (feedbackText.length > 1000) {
    throw createHttpError('Nội dung góp ý không được vượt quá 1000 ký tự.');
  }

  return {
    customer_id: user?._id || null,
    customer_name: customerName,
    customer_email: customerEmail,
    room_number: roomNumber,
    rating,
    feedback_text: feedbackText,
    status: 'submitted',
    submitted_at: new Date()
  };
};

const listHotelServices = asyncHandler(async (_req, res) => {
  const services = await HotelService.find({ is_active: { $ne: false } }).sort({ category: 1, name: 1 }).lean();

  res.send({
    services: (services.length > 0 ? services : serviceFallbacks).map(mapHotelService)
  });
});

const getHotelServiceDetail = asyncHandler(async (req, res) => {
  const serviceId = req.params.serviceId;
  const service = await findServiceById(serviceId);

  if (!service) {
    throw createHttpError('Không tìm thấy dịch vụ khách sạn.', 404);
  }

  res.send({
    service: mapHotelService(service)
  });
});

const listCustomerServiceRequests = asyncHandler(async (req, res) => {
  const requests = await CustomerServiceRequest.find({ customer_id: req.user._id }).sort({ requested_at: -1 }).lean();

  res.send({
    requests: requests.map(mapServiceRequest)
  });
});

const requestHotelService = asyncHandler(async (req, res) => {
  const service = await findServiceById(req.params.serviceId);

  if (!service) {
    throw createHttpError('Không tìm thấy dịch vụ khách sạn.', 404);
  }

  const roomNumber = String(req.body.roomNumber || req.body.room_number || '').trim();
  const note = String(req.body.note || '').trim();

  if (!/^[A-Za-z0-9-]{1,12}$/.test(roomNumber)) {
    throw createHttpError('Vui lòng nhập số phòng hợp lệ.');
  }

  if (note.length > 500) {
    throw createHttpError('Ghi chú yêu cầu dịch vụ không được vượt quá 500 ký tự.');
  }

  const request = await CustomerServiceRequest.create({
    customer_id: req.user._id,
    hotel_service_id: service._id || null,
    service_code: service.id || '',
    service_name: service.name,
    service_category: service.category || '',
    room_number: roomNumber,
    note,
    status: 'requested',
    requested_at: new Date()
  });

  res.status(201).send({
    message: 'Yêu cầu dịch vụ đã được gửi đến nhân viên khách sạn.',
    request: mapServiceRequest(request)
  });
});

const cancelCustomerServiceRequest = asyncHandler(async (req, res) => {
  if (!ObjectId.isValid(req.params.requestId)) {
    throw createHttpError('Không tìm thấy yêu cầu dịch vụ.', 404);
  }

  const request = await CustomerServiceRequest.findOne({
    _id: new ObjectId(req.params.requestId),
    customer_id: req.user._id
  });

  if (!request) {
    throw createHttpError('Không tìm thấy yêu cầu dịch vụ.', 404);
  }

  if (request.status !== 'requested') {
    throw createHttpError('Chỉ có thể hủy yêu cầu dịch vụ đang chờ xử lý.');
  }

  request.status = 'canceled';
  request.canceled_at = new Date();
  await request.save();

  res.send({
    message: 'Yêu cầu dịch vụ đã được hủy.',
    request: mapServiceRequest(request)
  });
});

const sendCustomerFeedback = asyncHandler(async (req, res) => {
  const existingFeedback = await CustomerFeedback.findOne({ customer_id: req.user._id }).lean();

  if (existingFeedback) {
    throw createHttpError('Bạn đã gửi góp ý rồi. Vui lòng cập nhật góp ý hiện có nếu muốn bổ sung.', 409);
  }

  const feedbackPayload = normalizeFeedbackPayload(req.body, req.user);
  const feedback = await CustomerFeedback.create(feedbackPayload);

  res.status(201).send({
    message: 'Cảm ơn bạn. Góp ý của bạn đã được gửi đến quản lý.',
    feedback: mapCustomerFeedback(feedback)
  });
});

const updateCustomerFeedback = asyncHandler(async (req, res) => {
  if (!ObjectId.isValid(req.params.feedbackId)) {
    throw createHttpError('Không tìm thấy góp ý.', 404);
  }

  const feedbackPayload = normalizeFeedbackPayload(req.body, req.user);
  const feedback = await CustomerFeedback.findOne({
    _id: new ObjectId(req.params.feedbackId),
    customer_id: req.user._id
  });

  if (!feedback) {
    throw createHttpError('Không tìm thấy góp ý.', 404);
  }

  if (!Array.isArray(feedback.feedback_history)) {
    feedback.feedback_history = [];
  }

  feedback.feedback_history.unshift({
    room_number: feedback.room_number || '',
    rating: feedback.rating,
    feedback_text: feedback.feedback_text,
    response_text: feedback.response_text || '',
    status: feedback.status,
    submitted_at: feedback.submitted_at || null,
    responded_at: feedback.responded_at || null,
    saved_at: new Date()
  });

  feedback.room_number = feedbackPayload.room_number;
  feedback.rating = feedbackPayload.rating;
  feedback.feedback_text = feedbackPayload.feedback_text;
  feedback.status = 'submitted';
  feedback.submitted_at = new Date();
  feedback.response_text = '';
  feedback.responded_at = null;
  feedback.archived_at = null;
  await feedback.save();

  res.send({
    message: 'Góp ý của bạn đã được cập nhật và gửi đến quản lý.',
    feedback: mapCustomerFeedback(feedback)
  });
});

const listCustomerFeedbacks = asyncHandler(async (req, res) => {
  const feedback = await CustomerFeedback.findOne({ customer_id: req.user._id }).sort({ submitted_at: -1 }).lean();

  res.send({
    feedbacks: feedback ? [mapCustomerFeedback(feedback)] : []
  });
});

module.exports = {
  cancelCustomerServiceRequest,
  getHotelServiceDetail,
  listCustomerFeedbacks,
  listCustomerServiceRequests,
  listHotelServices,
  requestHotelService,
  sendCustomerFeedback,
  updateCustomerFeedback
};








