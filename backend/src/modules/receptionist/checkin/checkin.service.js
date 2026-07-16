const mongoose = require('mongoose');
const { createHttpError } = require('../../../utils/error.utils');

const Booking = require('../../../models/booking.model');
const User = require('../../../models/user.model');
const RoomType = require('../../../models/room-type.model');
const Room = require('../../../models/room.model');
const BookingRoom = require('../../../models/booking-room.model');
const StayGuest = require('../../../models/stay-guest.model');

const generateWalkInCode = () => {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BKG-WALKIN-${suffix}`;
};

const getBookedRoomsCount = async (roomTypeId, checkInDate, checkOutDate) => {
  const bookings = await Booking.find({
    room_type_id: roomTypeId,
    booking_status: { $nin: ['Canceled', 'CheckedOut', 'Completed'] },
    check_in_date: { $lt: new Date(checkOutDate) },
    check_out_date: { $gt: new Date(checkInDate) }
  });
  return bookings.reduce((sum, b) => sum + (b.room_quantity || 1), 0);
};

const checkinService = {
  async getBookings(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Status filter
    if (query.status) {
      filter.booking_status = query.status;
    }

    // Date filter
    if (query.date && query.date !== 'all') {
      const parsedDate = new Date(query.date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.check_in_date = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (!query.date && !query.search) {
      // Default to today if no date and no search
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.check_in_date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Search filter with regex sanitization to prevent ReDoS
    if (query.search) {
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedSearch = escapeRegExp(query.search);
      const userFilter = { full_name: { $regex: escapedSearch, $options: 'i' } };
      const users = await User.find(userFilter).select('_id');
      const userIds = users.map(u => u._id);

      filter.$or = [
        { booking_code: { $regex: escapedSearch, $options: 'i' } },
        { customer_id: { $in: userIds } }
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customer_id', 'full_name email phone_number id_card_number')
        .populate('room_type_id', 'name base_price')
        .populate('room_id', 'roomName')
        .sort({ check_in_date: 1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter)
    ]);

    const mappedData = bookings.map(b => ({
      id: b._id.toString(),
      bookingCode: b.booking_code,
      customerName: b.customer_id ? b.customer_id.full_name : 'Walk-in Guest',
      roomTypeName: b.room_type_id ? b.room_type_id.name : 'Unknown Room Type',
      checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date,
      guestCount: b.guest_count,
      roomQuantity: b.room_quantity,
      totalAmount: b.total_amount,
      depositAmount: b.deposit_amount,
      paymentStatus: b.payment_status,
      bookingStatus: b.booking_status,
      source: b.source
    }));

    return {
      data: mappedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getBookingById(id) {
    const db = mongoose.connection.db;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError('Invalid booking ID format', 400);
    }

    const booking = await Booking.findById(id)
      .populate('customer_id', 'full_name email phone_number id_card_number')
      .populate('room_type_id')
      .populate('room_id');

    if (!booking) {
      throw createHttpError('Booking not found', 404);
    }

    // Related BookingRoom records
    let rooms = await BookingRoom.find({ booking_id: id }).populate('room_id');

    // Return virtual BookingRoom placeholders if none exist in the DB (REST-safe GET)
    if (rooms.length === 0 && booking.booking_status !== 'Canceled') {
      rooms = [];
      for (let i = 0; i < booking.room_quantity; i++) {
        rooms.push({
          _id: new mongoose.Types.ObjectId(), // Generate virtual temporary ID
          isVirtual: true,
          booking_id: booking._id,
          room_id: null,
          room_type_id: booking.room_type_id._id,
          room_number: '',
          status: 'Pending',
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date
        });
      }
    }

    // Related StayGuest records
    const bookingRoomIds = rooms.map(r => r._id);
    const stayGuests = await StayGuest.find({ booking_room_id: { $in: bookingRoomIds } });

    // Related payment info
    const payments = await db.collection('payments').find({ reservation_id: booking._id }).toArray();

    // Compute canCheckin and blocking reasons
    const blockingReasons = [];
    
    if (booking.payment_status !== 'Paid') {
      blockingReasons.push('Booking not fully paid');
    }

    // Check if every assigned room has status = Available
    const roomIds = rooms.map(r => r.room_id).filter(Boolean);
    const assignedRooms = await Room.find({ _id: { $in: roomIds } });
    
    assignedRooms.forEach(room => {
      if (room.status !== 'Available') {
        blockingReasons.push(`Room ${room.roomName} is currently ${room.status}`);
      }
      if (!room.isActive) {
        blockingReasons.push(`Room ${room.roomName} is inactive`);
      }
    });

    const isCheckedIn = booking.booking_status === 'CheckedIn' || booking.booking_status === 'Checked-in';
    const isCanceled = booking.booking_status === 'Canceled';
    const isCompleted = booking.booking_status === 'Completed';

    let canCheckin = true;
    if (isCheckedIn || isCanceled || isCompleted) {
      canCheckin = false;
      blockingReasons.push(`Booking is already ${booking.booking_status}`);
    } else if (booking.payment_status !== 'Paid') {
      canCheckin = false;
    } else if (roomIds.length > 0 && assignedRooms.some(r => r.status !== 'Available' || !r.isActive)) {
      canCheckin = false;
    }

    return {
      booking: {
        id: booking._id.toString(),
        bookingCode: booking.booking_code,
        customer: booking.customer_id ? {
          id: booking.customer_id._id,
          fullName: booking.customer_id.full_name,
          email: booking.customer_id.email,
          phoneNumber: booking.customer_id.phone_number,
          idCardNumber: booking.customer_id.id_card_number
        } : null,
        roomType: booking.room_type_id ? {
          id: booking.room_type_id._id,
          name: booking.room_type_id.name
        } : null,
        room: booking.room_id ? {
          id: booking.room_id._id,
          roomName: booking.room_id.roomName
        } : null,
        checkInDate: booking.check_in_date,
        checkOutDate: booking.check_out_date,
        guestCount: booking.guest_count,
        adultCount: booking.adult_count,
        childCount: booking.child_count,
        roomQuantity: booking.room_quantity,
        specialRequest: booking.special_request,
        totalAmount: booking.total_amount,
        depositAmount: booking.deposit_amount,
        paymentStatus: booking.payment_status,
        bookingStatus: booking.booking_status,
        source: booking.source,
        createdAt: booking.created_at
      },
      rooms: rooms.map(r => ({
        id: r._id.toString(),
        roomId: r.room_id ? r.room_id._id.toString() : null,
        roomName: r.room_id ? r.room_id.roomName : r.room_number || '',
        roomTypeName: booking.room_type_id ? booking.room_type_id.name : '',
        status: r.status,
        checkInDate: r.check_in_date,
        checkOutDate: r.check_out_date,
        isVirtual: r.isVirtual || false
      })),
      stayGuests: stayGuests.map(sg => ({
        id: sg._id.toString(),
        bookingRoomId: sg.booking_room_id.toString(),
        fullName: sg.full_name,
        phoneNumber: sg.phone_number,
        idCardNumber: sg.id_card_number,
        passportNumber: sg.passport_number,
        documentType: sg.document_type
      })),
      payments: payments.map(p => ({
        id: p._id.toString(),
        amount: p.amount,
        paymentMethod: p.payment_method,
        status: p.status,
        paidAt: p.paid_at || p.created_at
      })),
      canCheckin,
      blockingReasons
    };
  },

  async processCheckIn(bookingId, body) {
    const { stayGuests, roomAssignments } = body;

    try {
      // 1. Fetch booking within transaction
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw createHttpError('Booking not found', 404);
      }

      if (booking.booking_status === 'CheckedIn' || booking.booking_status === 'Checked-in') {
        throw createHttpError('Booking is already checked in', 400);
      }
      if (booking.booking_status === 'Canceled') {
        throw createHttpError('Booking is canceled', 400);
      }
      if (booking.booking_status === 'Completed') {
        throw createHttpError('Booking is completed', 400);
      }

      // BR-01: Re-check paymentStatus = Paid
      if (booking.payment_status !== 'Paid') {
        throw createHttpError('Booking not fully paid', 400);
      }

      // 2. Fetch all BookingRoom records for this booking
      let bookingRooms = await BookingRoom.find({ booking_id: bookingId });
      
      // If none exist, we initialize them now (safe POST action)
      if (bookingRooms.length === 0) {
        const newRooms = [];
        for (let i = 0; i < booking.room_quantity; i++) {
          newRooms.push({
            booking_id: booking._id,
            room_id: null,
            room_type_id: booking.room_type_id._id,
            room_number: '',
            status: 'Pending',
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date
          });
        }
        bookingRooms = await BookingRoom.insertMany(newRooms);

        // Map virtual client-provided bookingRoomIds to the database IDs in order
        const uniqueClientRoomIds = [...new Set([
          ...roomAssignments.map(a => a.bookingRoomId),
          ...stayGuests.map(g => g.bookingRoomId)
        ])];

        const idMap = {};
        uniqueClientRoomIds.forEach((clientId, idx) => {
          if (bookingRooms[idx]) {
            idMap[clientId] = bookingRooms[idx]._id.toString();
          }
        });

        // Rewrite client-provided IDs in the payload to database IDs
        roomAssignments.forEach(a => {
          if (idMap[a.bookingRoomId]) {
            a.bookingRoomId = idMap[a.bookingRoomId];
          }
        });
        stayGuests.forEach(g => {
          if (idMap[g.bookingRoomId]) {
            g.bookingRoomId = idMap[g.bookingRoomId];
          }
        });
      }

      // 3. Apply room assignments
      const assignedRoomIds = [];
      const roomsToUpdate = [];

      for (const assignment of roomAssignments) {
        const bRoom = bookingRooms.find(r => r._id.toString() === assignment.bookingRoomId);
        if (!bRoom) {
          throw createHttpError(`BookingRoom ${assignment.bookingRoomId} not found in this booking`, 400);
        }

        const room = await Room.findById(assignment.roomId);
        if (!room) {
          throw createHttpError(`Room ${assignment.roomId} not found`, 404);
        }

        // Validate selected physical room type matches booked room type
        if (room.room_type_id.toString() !== bRoom.room_type_id.toString()) {
          throw createHttpError(`Room ${room.roomName} does not match booked room type`, 400);
        }

        // BR-02: Verify assigned room is Available and active
        if (room.status !== 'Available') {
          throw createHttpError(`Room ${room.roomName} is not available (status: ${room.status})`, 400);
        }
        if (!room.isActive) {
          throw createHttpError(`Room ${room.roomName} is inactive`, 400);
        }

        if (assignedRoomIds.includes(assignment.roomId)) {
          throw createHttpError(`Room ${room.roomName} cannot be assigned multiple times`, 400);
        }
        assignedRoomIds.push(assignment.roomId);

        bRoom.room_id = room._id;
        bRoom.room_number = room.roomName;
        bRoom.status = 'CheckedIn';
        await bRoom.save();

        roomsToUpdate.push(room);
      }

      // 4. Validate and Create/Update StayGuest records
      const guestRooms = stayGuests.map(g => g.bookingRoomId);
      
      // BR-03: Every room must have at least one stay guest
      for (const bRoom of bookingRooms) {
        if (!guestRooms.includes(bRoom._id.toString())) {
          throw createHttpError(`Room ${bRoom.room_number || 'unassigned'} has no guest identity recorded`, 400);
        }
      }

      // Delete existing stay guests for this booking ONCE before loop (REST-safe batch delete)
      const bookingRoomIds = bookingRooms.map(r => r._id);
      await StayGuest.deleteMany({ booking_room_id: { $in: bookingRoomIds } });

      // Insert StayGuest records
      for (const guest of stayGuests) {
        const bRoom = bookingRooms.find(r => r._id.toString() === guest.bookingRoomId);
        if (!bRoom) {
          throw createHttpError(`StayGuest refers to invalid bookingRoomId ${guest.bookingRoomId}`, 400);
        }

        const newGuest = new StayGuest({
          booking_room_id: guest.bookingRoomId,
          user_id: booking.customer_id || null,
          full_name: guest.fullName,
          phone_number: guest.phoneNumber || '',
          id_card_number: guest.idCardNumber || '',
          passport_number: guest.passportNumber || '',
          document_type: guest.documentType || 'ID_CARD'
        });
        await newGuest.save();

        // BR-10: First-time ID entry for booking contact (names must match exactly)
        if (booking.customer_id) {
          const user = await User.findById(booking.customer_id);
          if (user && !user.id_card_number && guest.idCardNumber) {
            if (user.full_name.toLowerCase() === guest.fullName.toLowerCase()) {
              user.id_card_number = guest.idCardNumber;
              if (guest.phoneNumber && !user.phone_number) {
                user.phone_number = guest.phoneNumber;
              }
              await user.save();
            }
          }
        }
      }

      // 5. Atomic update Booking status & Room statuses (BR-07)
      booking.booking_status = 'CheckedIn';
      if (assignedRoomIds.length === 1) {
        booking.room_id = assignedRoomIds[0];
      }
      await booking.save();

      for (const room of roomsToUpdate) {
        room.status = 'Occupied';
        await room.save();
      }


      const updatedBooking = await Booking.findById(bookingId)
        .populate('customer_id', 'full_name email phone_number')
        .populate('room_type_id', 'name')
        .populate('room_id', 'roomName');

      const updatedRooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id');

      return {
        booking: updatedBooking,
        rooms: updatedRooms.map(r => ({
          id: r._id.toString(),
          roomId: r.room_id ? r.room_id._id.toString() : null,
          roomName: r.room_id ? r.room_id.roomName : '',
          status: r.status
        }))
      };

    } catch (error) {
      throw error;
    }
  },

  async createWalkInBooking(body) {
    const { roomTypeId, roomCount, checkInDate, checkOutDate, guestCount, adultCount, childCount, specialRequest } = body;

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      throw createHttpError('Room type not found', 404);
    }

    // 1. Validate room availability
    const totalRooms = await Room.countDocuments({ room_type_id: roomTypeId, isActive: true, status: { $ne: 'OutOfService' } });
    const bookedRooms = await getBookedRoomsCount(roomTypeId, checkInDate, checkOutDate);
    const availableCount = Math.max(0, totalRooms - bookedRooms);

    if (availableCount < roomCount) {
      throw createHttpError(`Only ${availableCount} room(s) available for this type`, 409);
    }

    const nights = Math.max(1, Math.round((new Date(checkOutDate) - new Date(checkInDate)) / (24 * 60 * 60 * 1000)));
    const totalAmount = (roomType.base_price || 0) * nights * roomCount;

    const now = new Date();
    const booking = new Booking({
      booking_code: generateWalkInCode(),
      customer_id: null,
      room_type_id: roomTypeId,
      room_id: null,
      check_in_date: new Date(checkInDate),
      check_out_date: new Date(checkOutDate),
      guest_count: guestCount || 1,
      adult_count: adultCount || 1,
      child_count: childCount || 0,
      room_quantity: roomCount,
      special_request: specialRequest || '',
      total_amount: totalAmount,
      deposit_amount: totalAmount,
      payment_status: 'Paid',
      booking_status: 'Confirmed',
      source: 'Walk-in',
      created_at: now,
      updated_at: now
    });

    await booking.save();

    // Create BookingRoom records
    const newRooms = [];
    for (let i = 0; i < roomCount; i++) {
      newRooms.push({
        booking_id: booking._id,
        room_id: null,
        room_type_id: roomTypeId,
        room_number: '',
        status: 'Pending',
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date
      });
    }

    const rooms = await BookingRoom.insertMany(newRooms);

    return {
      booking,
      rooms: rooms.map(r => ({
        id: r._id.toString(),
        status: r.status
      }))
    };
  },

  async getAvailableRooms(roomTypeId, checkInDate, checkOutDate) {
    if (!roomTypeId || !checkInDate || !checkOutDate) {
      throw createHttpError('roomTypeId, checkInDate, and checkOutDate are required', 400);
    }

    // Exclude rooms assigned to overlapping active booking rooms
    const overlappingBookingRooms = await BookingRoom.find({
      room_id: { $ne: null },
      status: { $in: ['Pending', 'CheckedIn'] },
      check_in_date: { $lt: new Date(checkOutDate) },
      check_out_date: { $gt: new Date(checkInDate) }
    });

    const assignedRoomIds = overlappingBookingRooms.map(br => br.room_id.toString());

    // Query active available rooms
    const rooms = await Room.find({
      room_type_id: roomTypeId,
      status: 'Available',
      isActive: true,
      _id: { $nin: assignedRoomIds }
    });

    return rooms;
  },

  async getRoomTypes() {
    return RoomType.find({ is_active: true }).sort({ display_order: 1 });
  },

  async getDashboardStats() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [arrivalsCount, checkedInCount, departuresCount, activeRequestsCount, recentBookings] = await Promise.all([
      Booking.countDocuments({
        check_in_date: { $gte: startOfDay, $lte: endOfDay },
        booking_status: { $in: ['Pending', 'Confirmed'] }
      }),
      Booking.countDocuments({
        check_in_date: { $gte: startOfDay, $lte: endOfDay },
        booking_status: 'CheckedIn'
      }),
      Booking.countDocuments({
        check_out_date: { $gte: startOfDay, $lte: endOfDay },
        booking_status: 'CheckedIn'
      }),
      mongoose.model('CustomerServiceRequest').countDocuments({ status: 'requested' }),
      Booking.find({
        $or: [
          { check_in_date: { $gte: startOfDay, $lte: endOfDay } },
          { check_out_date: { $gte: startOfDay, $lte: endOfDay } }
        ]
      })
      .populate('customer_id', 'full_name')
      .populate('room_type_id', 'name')
      .populate('room_id', 'roomName')
      .sort({ check_in_date: 1 })
      .limit(5)
    ]);

    // Query room status counts
    const [availableRooms, occupiedRooms, maintenanceRooms, outOfServiceRooms] = await Promise.all([
      Room.countDocuments({ status: 'Available', isActive: true }),
      Room.countDocuments({ status: 'Occupied', isActive: true }),
      Room.countDocuments({ status: 'Maintenance', isActive: true }),
      Room.countDocuments({ status: 'OutOfService', isActive: true })
    ]);

    // Query active service requests
    const activeRequests = await mongoose.model('CustomerServiceRequest')
      .find({ status: 'requested' })
      .populate('customer_id', 'full_name')
      .limit(5);

    return {
      kpis: {
        arrivalsToday: arrivalsCount,
        checkedInToday: checkedInCount,
        departuresToday: departuresCount,
        activeRequests: activeRequestsCount
      },
      roomStatus: {
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        outOfService: outOfServiceRooms
      },
      recentBookings: recentBookings.map(b => ({
        id: b._id.toString(),
        bookingCode: b.booking_code,
        customerName: b.customer_id ? b.customer_id.full_name : 'Walk-in Guest',
        roomTypeName: b.room_type_id ? b.room_type_id.name : 'Unknown Room Type',
        roomName: b.room_id ? b.room_id.roomName : 'Chưa gán',
        checkInDate: b.check_in_date,
        checkOutDate: b.check_out_date,
        paymentStatus: b.payment_status,
        bookingStatus: b.booking_status
      })),
      serviceRequests: activeRequests.map(req => ({
        serviceName: req.service_name,
        roomNumber: req.room_number,
        customerName: req.customer_id ? req.customer_id.full_name : 'Guest'
      }))
    };
  }
};

module.exports = checkinService;
