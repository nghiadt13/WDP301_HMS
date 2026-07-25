const customerFeedbackService = require('../../src/modules/customer/feedback/feedback.service');
const CustomerFeedback = require('../../src/models/customerFeedback.model');

jest.mock('../../src/models/customerFeedback.model');

describe('Customer Feedback Service Unit Tests (UT065 - UT070)', () => {
  let mockUser, mockFeedback;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      full_name: 'Nguyen Van A',
      email: 'customer@example.com'
    };

    mockFeedback = {
      _id: 'fb_101',
      customer_id: '507f1f77bcf86cd799439011',
      customer_name: 'Nguyen Van A',
      customer_email: 'customer@example.com',
      room_number: '101',
      rating: 5,
      feedback_text: 'Dịch vụ rất tốt!',
      status: 'submitted',
      submitted_at: new Date('2026-07-18T00:00:00.000Z')
    };
  });

  it('UT065: Lấy danh sách góp ý của tài khoản khách hàng (listCustomerFeedbacks)', async () => {
    CustomerFeedback.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockFeedback)
      })
    });

    const list = await customerFeedbackService.listCustomerFeedbacks(mockUser);

    expect(list).toHaveLength(1);
    expect(list[0].feedbackText).toBe('Dịch vụ rất tốt!');
  });

  it('UT066: Báo lỗi khi gửi góp ý mà tài khoản đã gửi góp ý rồi (409)', async () => {
    CustomerFeedback.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockFeedback)
    });

    await expect(
      customerFeedbackService.sendCustomerFeedback(
        { rating: 5, feedbackText: 'Great stay!' },
        mockUser
      )
    ).rejects.toHaveProperty(
      'message',
      'Bạn đã gửi góp ý rồi. Mỗi tài khoản chỉ được gửi một góp ý.'
    );
  });

  it('UT067: Lấy trạng thái góp ý (getFeedbackStatus)', async () => {
    customerFeedbackService.listFeedbackRooms = jest.fn().mockResolvedValue([]);
    CustomerFeedback.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    const status = await customerFeedbackService.getFeedbackStatus(mockUser);

    expect(status).toHaveProperty('hasFeedback', false);
    expect(status).toHaveProperty('canReview', false);
  });

  it('UT068: Trả về danh sách rỗng khi chưa có góp ý nào', async () => {
    CustomerFeedback.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })
    });

    const list = await customerFeedbackService.listCustomerFeedbacks(mockUser);

    expect(list).toEqual([]);
  });

  it('UT069: Map dữ liệu góp ý đúng cấu trúc', async () => {
    CustomerFeedback.findOne.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockFeedback)
      })
    });

    const list = await customerFeedbackService.listCustomerFeedbacks(mockUser);

    expect(list[0]).toHaveProperty('id', 'fb_101');
    expect(list[0]).toHaveProperty('rating', 5);
    expect(list[0]).toHaveProperty('customerName', 'Nguyen Van A');
  });

  it('UT070: Báo lỗi khi validate rating không hợp lệ (ngoài 1-5)', async () => {
    CustomerFeedback.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null)
    });

    // We test rating validation logic before reservation lookup
    const invalidBody = {
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      rating: 10,
      feedbackText: 'Very bad stay'
    };

    await expect(
      customerFeedbackService.sendCustomerFeedback(invalidBody, mockUser)
    ).rejects.toHaveProperty('message', 'Đánh giá phải từ 1 đến 5 sao.');
  });
});
