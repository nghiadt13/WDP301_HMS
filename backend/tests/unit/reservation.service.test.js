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

const reservationService = require('../../src/modules/customer/reservation/reservation.service');
const mongoose = require('mongoose');

describe('Customer Reservation Service Unit Tests (UT092 - UT099)', () => {
  let req, res, next, mockDbCollection;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        login_account: 'testcustomer',
        email: 'customer@example.com'
      },
      params: {
        roomId: '507f1f77bcf86cd799439022',
        reservationId: '507f1f77bcf86cd799439033'
      },
      body: {
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        adults: 2,
        children: 0,
        specialRequest: 'Quiet room'
      }
    };

    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    mockDbCollection = {
      findOne: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'Deluxe Suite',
        base_price: 1500000,
        is_active: true
      }),
      find: jest.fn().mockReturnValue({
        project: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([
              { _id: new mongoose.Types.ObjectId(), room_number: '101' }
            ])
          })
        }),
        toArray: jest.fn().mockResolvedValue([])
      }),
      countDocuments: jest.fn().mockResolvedValue(5),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'res_123' }),
      insertMany: jest.fn().mockResolvedValue(true),
      updateOne: jest.fn().mockResolvedValue(true),
      updateMany: jest.fn().mockResolvedValue(true)
    };

    mongoose.connection.db.collection.mockReturnValue(mockDbCollection);
  });

  it('UT092: Customer tạo đặt phòng (createRoomBooking) thành công', async () => {
    await reservationService.createRoomBooking(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Booking created'),
        reservation: expect.objectContaining({
          roomName: 'Deluxe Suite'
        })
      })
    );
  });

  it('UT093: Báo lỗi khi tạo booking thiếu ngày check-in/out hợp lệ', async () => {
    req.body.checkIn = 'invalid-date';

    await expect(reservationService.createRoomBooking(req, res, next)).rejects.toThrow(
      'Please choose valid check-in and check-out dates.'
    );
  });

  it('UT094: Báo lỗi khi ngày check-out nhỏ hơn hoặc bằng check-in', async () => {
    req.body.checkIn = '2026-08-10';
    req.body.checkOut = '2026-08-09';

    await expect(reservationService.createRoomBooking(req, res, next)).rejects.toThrow(
      'Check-out date must be after check-in date.'
    );
  });

  it('UT095: Báo lỗi khi số phòng trống không đủ cho ngày chọn', async () => {
    mockDbCollection.countDocuments.mockResolvedValue(0);

    await expect(reservationService.createRoomBooking(req, res, next)).rejects.toThrow(
      /are available for this room type/
    );
  });

  it('UT096: Xem chi tiết thông tin booking (getCustomerReservation)', async () => {
    const mockResDoc = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
      booking_code: 'BKG-TEST-123456',
      customer_id: req.user._id,
      room_type_id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
      total_amount: 3000000,
      booking_status: 'PendingPayment'
    };

    mockDbCollection.findOne.mockResolvedValue(mockResDoc);

    await reservationService.getCustomerReservation(req, res, next);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        reservation: expect.objectContaining({
          bookingCode: 'BKG-TEST-123456'
        })
      })
    );
  });

  it('UT097: Hủy booking chưa thanh toán (cancelCustomerReservation) thành công', async () => {
    const mockResDoc = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
      booking_code: 'BKG-TEST-123456',
      customer_id: req.user._id,
      check_in_date: new Date('2026-08-10'),
      total_amount: 3000000,
      booking_status: 'Pending'
    };

    mockDbCollection.findOne.mockResolvedValue(mockResDoc);

    await reservationService.cancelCustomerReservation(req, res, next);

    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Reservation canceled.'
      })
    );
  });

  it('UT098: Báo lỗi khi hủy booking trong vòng 48h sát ngày check-in', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const mockResDoc = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
      booking_code: 'BKG-TEST-123456',
      customer_id: req.user._id,
      check_in_date: tomorrow,
      total_amount: 3000000,
      booking_status: 'Confirmed'
    };

    mockDbCollection.findOne.mockResolvedValue(mockResDoc);
    mockDbCollection.find.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([{ amount: 3000000, status: 'Completed' }])
    });

    await expect(reservationService.cancelCustomerReservation(req, res, next)).rejects.toThrow(
      /within 48 hours of check-in/
    );
  });

  it('UT099: Báo lỗi 404 khi truy cập booking không tồn tại', async () => {
    mockDbCollection.findOne.mockResolvedValue(null);

    await expect(reservationService.getCustomerReservation(req, res, next)).rejects.toThrow(
      'Reservation not found'
    );
  });
});
