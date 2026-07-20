const mongoose = require('mongoose');
const { createHttpError } = require('../../../utils/error.utils');

const Booking = require('../../../models/booking.model');
const BookingRoom = require('../../../models/booking-room.model');
const StayGuest = require('../../../models/stay-guest.model');
const BookingCharge = require('../../../models/booking-charge.model');
const Invoice = require('../../../models/invoice.model');
const StaffTask = require('../../../models/staffTask.model');
const Room = require('../../../models/room.model');
const Inspection = require('../../../models/inspection.model');
const housekeepingService = require('../../manager/housekeeping/housekeeping.service');

const generateInvoiceCode = () => {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${suffix}`;
};

const sumMinibarTotal = (inspection) => {
  if (!inspection) return 0;
  if (typeof inspection.minibar_total === 'number') {
    return inspection.minibar_total;
  }

  const sourceItems = Array.isArray(inspection.invoice_items) && inspection.invoice_items.length > 0
    ? inspection.invoice_items
    : Array.isArray(inspection.minibar)
      ? inspection.minibar
      : [];

  return sourceItems.reduce((total, item) => {
    if (typeof item?.total === 'number') {
      return total + item.total;
    }
    const quantity = Number(item?.quantity || 0);
    const unitPrice = Number(item?.unit_price || item?.price || 0);
    return total + (quantity * unitPrice);
  }, 0);
};

const buildApprovedMinibarState = (inspectionState) => {
  const rooms = (inspectionState?.rooms || []).map((room) => {
    const items = room?.minibarReport?.items || [];
    const total = items.reduce((sum, item) => sum + Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0))), 0);

    return {
      ...room,
      minibarReport: {
        items,
        total,
      },
    };
  });

  return {
    rooms,
    total: rooms.reduce((sum, room) => sum + Number(room?.minibarReport?.total || 0), 0),
  };
};

const buildInspectionState = async (bookingId) => {
  const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
  const roomNames = rooms
    .map((room) => (room.room_id ? room.room_id.roomName : room.room_number))
    .filter(Boolean);

  const requestedTasks = await StaffTask.find({
    room_number: { $in: roomNames },
    cleaningType: 'Inspection Review',
  })
    .sort({ createdAt: -1 })
    .lean();

  const inspections = await Inspection.find({ room_number: { $in: roomNames } })
    .sort({ createdAt: -1 })
    .lean();

  const latestTaskByRoom = new Map();
  requestedTasks.forEach((task) => {
    if (!latestTaskByRoom.has(task.room_number)) {
      latestTaskByRoom.set(task.room_number, task);
    }
  });

  const latestInspectionByRoom = new Map();
  inspections.forEach((inspection) => {
    if (!latestInspectionByRoom.has(inspection.room_number)) {
      latestInspectionByRoom.set(inspection.room_number, inspection);
    }
  });

  const roomsState = roomNames.map((roomNumber) => {
    const task = latestTaskByRoom.get(roomNumber) || null;
    const inspection = latestInspectionByRoom.get(roomNumber) || null;
    const requestedAt = task?.createdAt ? new Date(task.createdAt).getTime() : null;
    const inspectedAt = inspection?.createdAt ? new Date(inspection.createdAt).getTime() : null;
    const inspectionConfirmed = Boolean(task && inspection && inspectedAt !== null && requestedAt !== null && inspectedAt >= requestedAt);
    const minibarItems = Array.isArray(inspection?.invoice_items)
      ? inspection.invoice_items.map((item) => ({
        name: item.name || 'Minibar item',
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        total: Number(item.total || 0),
        note: item.note || 'Minibar usage recorded during inspection',
      }))
      : [];
    const minibarTotal = sumMinibarTotal(inspection);

    return {
      roomNumber,
      task,
      inspection,
      inspectionConfirmed,
      minibarReport: {
        items: minibarItems,
        total: minibarTotal,
      },
    };
  });

  return {
    rooms: roomsState,
    tasks: roomsState
      .filter((entry) => entry.task)
      .map(({ roomNumber, task, inspection, inspectionConfirmed, minibarReport }) => ({
        ...task,
        room_number: roomNumber,
        inspectionConfirmed,
        inspectionId: inspection?._id || null,
        inspectionStatus: inspection?.status || null,
        confirmedAt: inspection?.createdAt || null,
        inspectionNote: inspection?.note || inspection?.remarks || '',
        minibarReport,
      })),
    allRoomsConfirmed: roomsState.length > 0 && roomsState.every((entry) => entry.inspectionConfirmed),
    pendingRooms: roomsState
      .filter((entry) => !entry.inspectionConfirmed)
      .map((entry) => entry.roomNumber),
  };
};

const checkoutService = {
  getCheckoutSummary: async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate('customer_id', 'full_name email phone_number');
    if (!booking) throw createHttpError(404, 'Booking not found');

    const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
    const stayGuests = await StayGuest.find({ booking_id: bookingId });
    const charges = await BookingCharge.find({ booking_id: bookingId });
    const invoices = await Invoice.find({ booking_id: bookingId });

    const inspectionState = await buildInspectionState(bookingId);

    return {
      booking: {
        id: booking._id,
        bookingCode: booking.booking_code,
        status: booking.booking_status,
        customerName: booking.customer_id ? booking.customer_id.full_name : 'Walk-in Guest',
        totalAmount: booking.total_amount,
        depositAmount: booking.deposit_amount,
        paymentStatus: booking.payment_status,
      },
      rooms: rooms.map(r => ({
        id: r._id,
        roomId: r.room_id ? r.room_id._id : null,
        roomName: r.room_id ? r.room_id.roomName : r.room_number,
        status: r.status
      })),
      stayGuests,
      charges,
      inspectionState,
      invoice: invoices.length > 0 ? invoices[0] : null
    };
  },

  createInspectionRequest: async (bookingId, taskData, user) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw createHttpError(404, 'Booking not found');

    const task = new StaffTask({
      title: `Kiểm tra phòng ${taskData.room_number} (Check-out)`,
      description: taskData.description || `Kiểm tra tình trạng phòng ${taskData.room_number} sau khi khách trả phòng.`,
      staff_type: 'housekeeping',
      room_number: taskData.room_number,
      priority: taskData.priority || 'medium',
      status: 'Assigned',
      cleaningType: 'Inspection Review',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    });
    
    await task.save();
    return task;
  },

  getInspectionResults: async (bookingId) => {
    return buildInspectionState(bookingId);
  },

  addCharge: async (bookingId, chargeData) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw createHttpError(404, 'Booking not found');

    const charge = new BookingCharge({
      booking_id: bookingId,
      room_id: chargeData.room_id || null,
      description: chargeData.description,
      amount: chargeData.amount,
      charge_type: chargeData.charge_type
    });

    await charge.save();

    // If an invoice exists and is unpaid, we might want to update it or delete it so it's regenerated
    await Invoice.findOneAndDelete({ booking_id: bookingId, status: 'Unpaid' });

    return charge;
  },

  removeCharge: async (bookingId, chargeId) => {
    const charge = await BookingCharge.findOneAndDelete({ _id: chargeId, booking_id: bookingId });
    if (!charge) throw createHttpError(404, 'Charge not found');
    
    await Invoice.findOneAndDelete({ booking_id: bookingId, status: 'Unpaid' });
  },

  generateInvoice: async (bookingId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw createHttpError(404, 'Booking not found');

    // Check if a paid invoice already exists
    const existingPaid = await Invoice.findOne({ booking_id: bookingId, status: 'Paid' });
    if (existingPaid) return existingPaid;

    const inspectionState = await buildInspectionState(bookingId);
    const approvedMinibarState = buildApprovedMinibarState(inspectionState);
    const minibarChargesTotal = approvedMinibarState.total;

    const charges = await BookingCharge.find({ booking_id: bookingId });
    const manualChargesTotal = charges
      .filter((charge) => String(charge.charge_type || '').toLowerCase() !== 'minibar')
      .reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
    const extraChargesTotal = manualChargesTotal + minibarChargesTotal;

    const roomCharge = booking.total_amount;
    const subtotal = roomCharge + extraChargesTotal;
    const depositDeducted = booking.deposit_amount || 0;
    
    // finalTotal can't be negative. If deposit > subtotal, final is 0 (refund needed, but we simplify here)
    const finalTotal = Math.max(0, subtotal - depositDeducted);

    // Delete existing unpaid invoice to regenerate
    await Invoice.findOneAndDelete({ booking_id: bookingId, status: 'Unpaid' });

    const invoice = new Invoice({
      booking_id: bookingId,
      invoice_code: generateInvoiceCode(),
      room_charge: roomCharge,
      extra_charges: extraChargesTotal,
      subtotal: subtotal,
      deposit_deducted: depositDeducted,
      final_total: finalTotal,
      status: finalTotal === 0 ? 'Paid' : 'Unpaid'
    });

    await invoice.save();
    return invoice;
  },

  completeCheckout: async (bookingId, paymentMethod) => {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) throw createHttpError(404, 'Booking not found');

      if (booking.booking_status !== 'CheckedIn') {
        throw createHttpError(400, 'Booking is not in CheckedIn state');
      }

      const inspectionState = await buildInspectionState(bookingId);
      if (!inspectionState.allRoomsConfirmed) {
        const pendingRoomsLabel = inspectionState.pendingRooms.join(', ');
        throw createHttpError(`Housekeeping must confirm inspection before checkout can continue${pendingRoomsLabel ? ` for room(s): ${pendingRoomsLabel}` : ''}`, 409);
      }

      const approvedMinibarState = buildApprovedMinibarState(inspectionState);

      const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
      const roomNames = rooms.map(r => r.room_id ? r.room_id.roomName : r.room_number).filter(Boolean);

      // Find the invoice
      let invoice = await Invoice.findOne({ booking_id: bookingId });
      if (!invoice) {
        invoice = await checkoutService.generateInvoice(bookingId);
      }

      const charges = await BookingCharge.find({ booking_id: bookingId });
      const manualChargesTotal = charges
        .filter((charge) => String(charge.charge_type || '').toLowerCase() !== 'minibar')
        .reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
      const minibarChargesTotal = approvedMinibarState.total;
      const roomCharge = booking.total_amount;
      const subtotal = roomCharge + manualChargesTotal + minibarChargesTotal;
      const depositDeducted = booking.deposit_amount || 0;
      const finalTotal = Math.max(0, subtotal - depositDeducted);

      invoice.room_charge = roomCharge;
      invoice.extra_charges = manualChargesTotal + minibarChargesTotal;
      invoice.subtotal = subtotal;
      invoice.deposit_deducted = depositDeducted;
      invoice.final_total = finalTotal;
      invoice.status = 'Paid';
      invoice.payment_method = paymentMethod;
      invoice.payment_date = new Date();
      await invoice.save();

      // Update Booking
      booking.booking_status = 'CheckedOut';
      booking.payment_status = 'Paid';
      await booking.save();

      // Update BookingRooms
      await BookingRoom.updateMany(
        { booking_id: bookingId },
        { status: 'CheckedOut' }
      );

      // Mark actual rooms as dirty and create housekeeping cleaning tasks immediately.
      const bookingRooms = await BookingRoom.find({ booking_id: bookingId });
      const roomIds = bookingRooms.map(br => br.room_id).filter(Boolean);
      await Room.updateMany(
        { _id: { $in: roomIds } },
        { status: 'Dirty' }
      );

      await Promise.all(
        roomNames.map((roomNumber) => housekeepingService.confirmCheckout({
          room_number: roomNumber,
          priority: 'high',
          receptionistNote: 'Checkout confirmed by receptionist. Room needs cleaning before next arrival.',
          guestRequest: '',
          cleaningType: 'Checkout Cleaning',
          assignedBy: 'Receptionist',
          checkoutTime: new Date().toISOString(),
        }, {
          _id: null,
          full_name: 'Receptionist',
          role_id: { name: 'Receptionist' },
        }))
      );



      return { booking, invoice };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = checkoutService;
