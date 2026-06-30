const CustomerFeedback = require('../models/customerFeedback.model');

let mockFeedbacks = [
  {
    _id: 'feedback-001',
    customer_name: 'Nguyen Minh Anh',
    customer_email: 'minhanh@example.com',
    room_number: '305',
    rating: 5,
    feedback_text: 'The receptionist was very helpful and check-in was fast.',
    response_text: '',
    status: 'submitted',
    submitted_at: new Date('2026-06-28')
  },
  {
    _id: 'feedback-002',
    customer_name: 'Tran Hoang Long',
    customer_email: 'long@example.com',
    room_number: '210',
    rating: 3,
    feedback_text: 'The room was clean, but the air conditioner was noisy at night.',
    response_text: '',
    status: 'submitted',
    submitted_at: new Date('2026-06-28')
  },
  {
    _id: 'feedback-003',
    customer_name: 'Le Thu Ha',
    customer_email: 'thuha@example.com',
    room_number: '118',
    rating: 4,
    feedback_text: 'Breakfast was good. Please add more minibar drink options.',
    response_text: 'Thank you for your feedback. We will review minibar options with the operations team.',
    status: 'responded',
    submitted_at: new Date('2026-06-29'),
    responded_at: new Date('2026-06-29')
  }
];

const isMockId = (feedbackId) => String(feedbackId || '').startsWith('feedback-');

const listCustomerFeedbacks = async (filter = {}) => {
  const feedbacks = await CustomerFeedback.find(filter).sort({ submitted_at: -1 }).lean();

  if (feedbacks.length) {
    return feedbacks;
  }

  return [...mockFeedbacks].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
};

const respondCustomerFeedback = async (feedbackId, responseText) => {
  if (isMockId(feedbackId)) {
    mockFeedbacks = mockFeedbacks.map((feedback) =>
      feedback._id === feedbackId
        ? { ...feedback, response_text: responseText, status: 'responded', responded_at: new Date() }
        : feedback
    );

    return mockFeedbacks.find((feedback) => feedback._id === feedbackId);
  }

  return CustomerFeedback.findByIdAndUpdate(
    feedbackId,
    { response_text: responseText, status: 'responded', responded_at: new Date() },
    { new: true, runValidators: true }
  );
};

const archiveCustomerFeedback = async (feedbackId) => {
  if (isMockId(feedbackId)) {
    mockFeedbacks = mockFeedbacks.map((feedback) =>
      feedback._id === feedbackId
        ? { ...feedback, status: 'archived', archived_at: new Date() }
        : feedback
    );

    return mockFeedbacks.find((feedback) => feedback._id === feedbackId);
  }

  return CustomerFeedback.findByIdAndUpdate(
    feedbackId,
    { status: 'archived', archived_at: new Date() },
    { new: true, runValidators: true }
  );
};

module.exports = {
  archiveCustomerFeedback,
  listCustomerFeedbacks,
  respondCustomerFeedback
};
