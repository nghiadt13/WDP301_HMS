jest.mock('../../src/utils/async-handler', () => (fn) => fn);
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    connection: {
      db: {
        collection: jest.fn()
      }
    }
  };
});

const paymentService = require('../../src/modules/customer/payment/payment.service');
const mongoose = require('mongoose');

describe('Customer Payment Service Unit Tests (UT100 - UT105)', () => {
  let req, res, next, mockDbCollection;

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.VNPAY_TMN_CODE = 'TESTTMNCODE';
    process.env.VNPAY_HASH_SECRET = 'TESTHASHSECRET';
    process.env.CLIENT_URL = 'http://localhost:5173';

    req = {
      user: {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        login_account: 'testcustomer'
      },
      params: {
        reservationId: '507f1f77bcf86cd799439033'
      },
      body: {
        acceptedHotelPolicies: true
      },
      headers: {},
      get: jest.fn().mockReturnValue('localhost:5000')
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    const makeFindChain = (data = []) => ({
      sort: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(data)
      }),
      toArray: jest.fn().mockResolvedValue(data)
    });

    mockDbCollection = {
      findOne: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
        booking_code: 'BKG-TEST-123456',
        total_amount: 2000000,
        payment_status: 'Unpaid',
        booking_status: 'PendingPayment'
      }),
      find: jest.fn().mockImplementation(() => makeFindChain([])),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'pay_123' }),
      updateOne: jest.fn().mockResolvedValue(true),
      updateMany: jest.fn().mockResolvedValue(true)
    };

    mongoose.connection.db.collection.mockReturnValue(mockDbCollection);
  });

  it('UT100: Tạo link thanh toán VNPAY (createVnpayPayment) thành công', async () => {
    await paymentService.createVnpayPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentUrl: expect.stringContaining('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
        amount: 2000000
      })
    );
  });

  it('UT101: Báo lỗi khi chưa chấp nhận chính sách khách sạn trước khi thanh toán', async () => {
    req.body.acceptedHotelPolicies = false;

    await expect(paymentService.createVnpayPayment(req, res, next)).rejects.toThrow(
      'Please agree to the hotel policies before payment.'
    );
  });

  it('UT102: Báo lỗi khi reservation không tồn tại (404)', async () => {
    mockDbCollection.findOne.mockResolvedValue(null);

    await expect(paymentService.createVnpayPayment(req, res, next)).rejects.toThrow(
      'Reservation not found'
    );
  });

  it('UT103: Trả về thông báo booking đã được thanh toán rồi', async () => {
    const mockReservation = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
      booking_code: 'BKG-TEST-123456',
      total_amount: 2000000,
      payment_status: 'Paid'
    };

    mockDbCollection.findOne.mockResolvedValue(mockReservation);

    await paymentService.createVnpayPayment(req, res, next);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Reservation is already paid.',
        paymentStatus: 'Paid'
      })
    );
  });

  it('UT104: Lấy danh sách chính sách khách sạn (getHotelPolicies)', async () => {
    const policyItem = { _id: 'p1', title: 'Checkin policy', category: 'General', content: 'Info', display_order: 1 };
    mockDbCollection.find.mockImplementation(() => ({
      sort: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([policyItem])
      })
    }));

    await paymentService.getHotelPolicies(req, res, next);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        policies: expect.arrayContaining([
          expect.objectContaining({ title: 'Checkin policy' })
        ])
      })
    );
  });

  it('UT105: Lấy trạng thái thanh toán của booking (getReservationPaymentStatus)', async () => {
    const mockReservation = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
      total_amount: 2000000,
      payment_status: 'Paid'
    };

    mockDbCollection.findOne.mockResolvedValue(mockReservation);

    await paymentService.getReservationPaymentStatus(req, res, next);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        totalAmount: 2000000,
        paymentStatus: 'Paid'
      })
    );
  });
});
