const checkoutService = require('../../src/modules/receptionist/checkout/checkout.service');
const Booking = require('../../src/models/booking.model');
const BookingRoom = require('../../src/models/booking-room.model');
const BookingCharge = require('../../src/models/booking-charge.model');
const Invoice = require('../../src/models/invoice.model');
const StaffTask = require('../../src/models/staffTask.model');
const Inspection = require('../../src/models/inspection.model');
const Room = require('../../src/models/room.model');
const StayGuest = require('../../src/models/stay-guest.model');
const housekeepingService = require('../../src/modules/manager/housekeeping/housekeeping.service');
const mongoose = require('mongoose');

jest.mock('../../src/models/booking.model');
jest.mock('../../src/models/booking-room.model');
jest.mock('../../src/models/booking-charge.model');
jest.mock('../../src/models/invoice.model');
jest.mock('../../src/models/staffTask.model');
jest.mock('../../src/models/inspection.model');
jest.mock('../../src/models/room.model');
jest.mock('../../src/models/stay-guest.model');
jest.mock('../../src/modules/manager/housekeeping/housekeeping.service');

describe('Receptionist Check-out Service Unit Tests (UT114 - UT119)', () => {
  let mockBooking, mockInvoice, mockBookingRoomsArr;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBooking = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      booking_code: 'BKG-101',
      booking_status: 'CheckedIn',
      payment_status: 'Paid',
      total_amount: 2000000,
      deposit_amount: 2000000,
      customer_id: { full_name: 'Nguyen Van A' },
      save: jest.fn().mockResolvedValue(true)
    };

    mockInvoice = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439055'),
      booking_id: mockBooking._id,
      final_total: 0,
      status: 'Paid',
      save: jest.fn().mockResolvedValue(true)
    };

    mockBookingRoomsArr = [
      { _id: 'br_1', room_number: '101', room_id: { _id: 'r1', roomName: '101' }, status: 'CheckedIn' }
    ];

    Booking.findById.mockImplementation(() => ({
      populate: jest.fn().mockResolvedValue(mockBooking)
    }));

    const makeChainable = (data) => {
      const chain = {
        sort: jest.fn().mockImplementation(() => chain),
        lean: jest.fn().mockImplementation(() => Promise.resolve(data)),
        populate: jest.fn().mockImplementation(() => Promise.resolve(data)),
        then: (resolve) => resolve(data)
      };
      return chain;
    };

    BookingRoom.find.mockImplementation(() => makeChainable(mockBookingRoomsArr));
    BookingRoom.updateMany.mockResolvedValue(true);

    StayGuest.find.mockImplementation(() => makeChainable([]));
    StaffTask.find.mockImplementation(() => makeChainable([]));
    Inspection.find.mockImplementation(() => makeChainable([]));
    BookingCharge.find.mockImplementation(() => makeChainable([]));
    Invoice.find.mockImplementation(() => makeChainable([mockInvoice]));
    Invoice.findOne.mockResolvedValue(null);
    Invoice.findOneAndDelete.mockResolvedValue(true);
  });

  it('UT114: Lấy thông tin tóm tắt Check-out (getCheckoutSummary)', async () => {
    const summary = await checkoutService.getCheckoutSummary('bkg_1');

    expect(summary).toHaveProperty('booking');
    expect(summary.booking.customerName).toBe('Nguyen Van A');
  });

  it('UT115: Tạo yêu cầu kiểm tra phòng trước Check-out (createInspectionRequest)', async () => {
    Booking.findById.mockResolvedValue(mockBooking);
    StaffTask.prototype.save = jest.fn().mockImplementation(function() {
      this.title = `Kiểm tra phòng ${this.room_number} (Check-out)`;
      this.cleaningType = 'Inspection Review';
      return Promise.resolve(this);
    });

    const task = await checkoutService.createInspectionRequest(mockBooking._id, { room_number: '101' });

    expect(task).toBeDefined();
  });

  it('UT116: Thêm phụ phí vào đơn booking (addCharge)', async () => {
    Booking.findById.mockResolvedValue(mockBooking);
    BookingCharge.prototype.save = jest.fn().mockImplementation(function() {
      this.amount = 20000;
      return Promise.resolve(this);
    });

    const charge = await checkoutService.addCharge(mockBooking._id, {
      description: 'Nước suối',
      amount: 20000,
      charge_type: 'other'
    });

    expect(charge).toBeDefined();
    expect(Invoice.findOneAndDelete).toHaveBeenCalledWith({ booking_id: mockBooking._id, status: 'Unpaid' });
  });

  it('UT117: Tính toán và phát hành hóa đơn Invoice (generateInvoice)', async () => {
    Booking.findById.mockResolvedValue(mockBooking);
    BookingCharge.find.mockResolvedValue([{ amount: 50000 }]);
    Invoice.prototype.save = jest.fn().mockImplementation(function() {
      this.extra_charges = 50000;
      this.subtotal = 2050000;
      return Promise.resolve(this);
    });

    const invoice = await checkoutService.generateInvoice(mockBooking._id);

    expect(invoice).toBeDefined();
  });

  it('UT118: Báo lỗi khi hoàn thành Check-out nếu phòng chưa được kiểm tra (Inspection Pending)', async () => {
    Booking.findById.mockResolvedValue(mockBooking);

    await expect(
      checkoutService.completeCheckout(mockBooking._id, 'Cash')
    ).rejects.toHaveProperty('message', expect.stringContaining('Housekeeping must confirm inspection'));
  });

  it('UT119: Hoàn thành Check-out (completeCheckout) thành công', async () => {
    Booking.findById.mockResolvedValue(mockBooking);

    const mockTask = { _id: 't1', room_number: '101', status: 'Completed', createdAt: new Date() };
    const mockInspectionDoc = { _id: 'i1', task_id: 't1', status: 'completed', createdAt: new Date() };

    const makeChainable = (data) => {
      const chain = {
        sort: jest.fn().mockImplementation(() => chain),
        lean: jest.fn().mockImplementation(() => Promise.resolve(data)),
        populate: jest.fn().mockImplementation(() => Promise.resolve(data)),
        then: (resolve) => resolve(data)
      };
      return chain;
    };

    StaffTask.find.mockImplementation(() => makeChainable([mockTask]));
    Inspection.find.mockImplementation(() => makeChainable([mockInspectionDoc]));

    Invoice.findOne.mockResolvedValue(mockInvoice);
    BookingCharge.find.mockResolvedValue([]);
    Room.findById.mockResolvedValue({ _id: 'r1', roomName: '101', status: 'Occupied', save: jest.fn().mockResolvedValue(true) });
    housekeepingService.confirmCheckout.mockResolvedValue(true);

    const result = await checkoutService.completeCheckout(mockBooking._id, 'Cash');

    expect(mockBooking.booking_status).toBe('CheckedOut');
    expect(result.invoice.status).toBe('Paid');
  });
});
