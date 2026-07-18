const CustomerFeedback = require('../../../models/customerFeedback.model');

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const customerFeedbackService = {
  async getCustomerFeedbacks(query = {}) {
    const filter = {};
    if (query.rating) filter.rating = Number(query.rating);
    if (query.status) filter.status = query.status;
    return CustomerFeedback.find(filter).sort({ submitted_at: -1, createdAt: -1 });
  },

  async respondCustomerFeedback(id, responseText, user) {
    const cleanResponse = String(responseText || '').trim();
    if (cleanResponse.length < 2) {
      throw createHttpError('Vui long nhap noi dung phan hoi.');
    }

    const response = {
      responseText: cleanResponse,
      responderId: user?._id || null,
      responderName: user?.full_name || 'Manager',
      respondedAt: new Date(),
    };

    const feedback = await CustomerFeedback.findByIdAndUpdate(
      id,
      {
        $set: {
          response_text: cleanResponse,
          status: 'responded',
          responded_at: response.respondedAt,
        },
        $push: { manager_responses: response },
      },
      { new: true, runValidators: true }
    );

    if (!feedback) throw createHttpError('Khong tim thay gop y.', 404);
    return feedback;
  },
};

module.exports = customerFeedbackService;
