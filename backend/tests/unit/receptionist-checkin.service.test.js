const checkinService = require('../../src/modules/receptionist/checkin/checkin.service');
const Booking = require('../../src/models/booking.model');
const BookingRoom = require('../../src/models/booking-room.model');
const Room = require('../../src/models/room.model');
const StayGuest = require('../../src/models/stay-guest.model');
const RoomType = require('../../src/models/room-type.model');
const mongoose = require('mongoose');

jest.mock('../../src/models/booking.model');
jest.mock('../../src/models/booking-room.model');
jest.mock('../../src/models/room.model');
jest.mock('../../src/models/stay-guest.model');
jest.mock('../../src/models/room-type.model');
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    connection: {
      db: {
        collection: jest.fn().mockReturnValue({
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'pay_walkin_1' })
        })
      }
    }
  };
});

describe('Receptionist Check-in Service Unit Tests (UT106 - UT113)', () => {
  let mockBooking, mockRoom, mockBookingRoom;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBooking = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      booking_code: 'BKG-101',
      room_quantity: 1,
      guest_count: 2,
      total_amount: 1500000,
      payment_status: 'Paid',
      booking_status: 'Confirmed',
      check_in_date: new Date('2026-07-25T00:00:00.000Z'),
      check_out_date: new Date('2026-07-27T00:00:00.000Z'),
      room_type_id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
      save: jest.fn().mockResolvedValue(true)
    };

    mockRoom = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
      roomName: '101',
      room_type_id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
      status: 'Available',
      isActive: true,
      save: jest.fn().mockResolvedValue(true)
    };

    mockBookingRoom = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439044'),
      booking_id: mockBooking._id,
      room_type_id: mockBooking.room_type_id,
      room_id: null,
      status: 'Pending',
      save: jest.fn().mockResolvedValue(true)
    };

    BookingRoom.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([mockBookingRoom])
    });

    Booking.find.mockResolvedValue([mockBooking]);
    StayGuest.deleteMany.mockResolvedValue(true);
  });

  it('UT106: Receptionist lấy danh sách booking (getBookings)', async () => {
    Booking.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockBooking])
              })
            })
          })
        })
      })
    });
    Booking.countDocuments.mockResolvedValue(1);

    const result = await checkinService.getBookings({});

    expect(result.data).toHaveLength(1);
    expect(result.data[0].bookingCode).toBe('BKG-101');
  });

  it('UT107: Báo lỗi khi check-in booking không tồn tại (404)', async () => {
    Booking.findById.mockResolvedValue(null);

    await expect(
      checkinService.processCheckIn('507f1f77bcf86cd799439011', { stayGuests: [], roomAssignments: [] })
    ).rejects.toHaveProperty('message', 'Booking not found');
  });

  it('UT108: Báo lỗi khi check-in booking đã CheckedIn rồi (400)', async () => {
    mockBooking.booking_status = 'CheckedIn';
    Booking.findById.mockResolvedValue(mockBooking);

    await expect(
      checkinService.processCheckIn('507f1f77bcf86cd799439011', { stayGuests: [], roomAssignments: [] })
    ).rejects.toHaveProperty('message', 'Booking is already checked in');
  });

  it('UT109: Báo lỗi khi check-in đơn chưa thanh toán đủ (payment_status != Paid)', async () => {
    mockBooking.payment_status = 'Unpaid';
    Booking.findById.mockResolvedValue(mockBooking);
    BookingRoom.find.mockResolvedValue([mockBookingRoom]);

    await expect(
      checkinService.processCheckIn('507f1f77bcf86cd799439011', { stayGuests: [], roomAssignments: [] })
    ).rejects.toHaveProperty('message', 'Booking not fully paid');
  });

  it('UT110: Thực hiện Check-in gán phòng & tạo StayGuest thành công', async () => {
    Booking.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockBooking)
        })
      })
    });
    Booking.findById.mockResolvedValueOnce(mockBooking);
    BookingRoom.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue([mockBookingRoom])
    });
    BookingRoom.find.mockResolvedValueOnce([mockBookingRoom]);

    Room.findById.mockResolvedValue(mockRoom);
    StayGuest.prototype.save = jest.fn().mockResolvedValue(true);

    const checkInPayload = {
      roomAssignments: [
        {
          bookingRoomId: mockBookingRoom._id.toString(),
          roomId: mockRoom._id.toString()
        }
      ],
      stayGuests: [
        {
          bookingRoomId: mockBookingRoom._id.toString(),
          fullName: 'Nguyen Van A',
          idCardNumber: '123456789'
        }
      ]
    };

    const result = await checkinService.processCheckIn(mockBooking._id.toString(), checkInPayload);

    expect(mockBooking.booking_status).toBe('CheckedIn');
    expect(mockRoom.status).toBe('Occupied');
  });

  it('UT111: Tạo Walk-in booking (createWalkInBooking) thành công', async () => {
    RoomType.findById.mockResolvedValue({ _id: 'rt_101', base_price: 1000000 });
    Room.countDocuments.mockResolvedValue(10);
    Booking.prototype.save = jest.fn().mockResolvedValue(true);
    BookingRoom.insertMany.mockResolvedValue([mockBookingRoom]);

    const walkInPayload = {
      roomTypeId: new mongoose.Types.ObjectId().toString(),
      roomCount: 1,
      checkInDate: '2026-07-25',
      checkOutDate: '2026-07-26',
      guestCount: 1,
      paymentMethod: 'Cash'
    };

    const result = await checkinService.createWalkInBooking(walkInPayload);

    expect(result.booking).toBeDefined();
    expect(result.rooms).toHaveLength(1);
  });

  it('UT112: Lấy danh sách phòng trống phục vụ gán phòng (getAvailableRooms)', async () => {
    BookingRoom.find.mockResolvedValue([]);
    Room.find.mockResolvedValue([mockRoom]);

    const available = await checkinService.getAvailableRooms('rt_101', '2026-07-25', '2026-07-26');

    expect(Room.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'Available' }));
    expect(available).toHaveLength(1);
  });

  it('UT113: Lấy danh sách loại phòng active (getRoomTypes)', async () => {
    RoomType.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'rt_1', name: 'Deluxe' }])
    });

    const roomTypes = await checkinService.getRoomTypes();

    expect(roomTypes).toHaveLength(1);
    expect(roomTypes[0].name).toBe('Deluxe');
  });
});
