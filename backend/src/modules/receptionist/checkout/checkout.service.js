const mongoose = require('mongoose');
const { createHttpError } = require('../../../utils/error.utils');

const Booking = require('../../../models/booking.model');
const BookingRoom = require('../../../models/booking-room.model');
const StayGuest = require('../../../models/stay-guest.model');
const BookingCharge = require('../../../models/booking-charge.model');
const Invoice = require('../../../models/invoice.model');
const StaffTask = require('../../../models/staffTask.model');
const Room = require('../../../models/room.model');

const generateInvoiceCode = () => {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${suffix}`;
};

const checkoutService = {
  getCheckoutSummary: async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate('customer_id', 'full_name email phone_number');
    if (!booking) throw createHttpError(404, 'Booking not found');

    const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
    const stayGuests = await StayGuest.find({ booking_id: bookingId });
    const charges = await BookingCharge.find({ booking_id: bookingId });
    const invoices = await Invoice.find({ booking_id: bookingId });

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
      status: 'open',
      deadline: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
    });
    
    await task.save();
    return task;
  },

  getInspectionResults: async (bookingId) => {
    const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
    const roomNames = rooms.map(r => r.room_id ? r.room_id.roomName : r.room_number).filter(Boolean);

    // Find tasks for these rooms created recently (e.g., within the last 24h, or just open/closed tasks related to check-out)
    const tasks = await StaffTask.find({
      room_number: { $in: roomNames },
      title: { $regex: /Check-out/i }
    }).sort({ createdAt: -1 });

    return tasks;
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

    const charges = await BookingCharge.find({ booking_id: bookingId });
    const extraChargesTotal = charges.reduce((sum, charge) => sum + charge.amount, 0);

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

      // SOP Rule 1: Validate inspection task is closed
      const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
      const roomNames = rooms.map(r => r.room_id ? r.room_id.roomName : r.room_number).filter(Boolean);
      
      const tasks = await StaffTask.find({
        room_number: { $in: roomNames },
        title: { $regex: /Check-out/i }
      }).sort({ createdAt: -1 });

      if (tasks.length < roomNames.length) {
        throw createHttpError(400, `Không thể checkout: Cần yêu cầu kiểm tra cho tất cả các phòng (${tasks.length}/${roomNames.length}).`);
      }
      
      const hasOpenTask = tasks.some(t => t.status !== 'closed');
      if (hasOpenTask) {
        throw createHttpError(400, 'Không thể checkout: Buồng phòng chưa hoàn tất kiểm tra.');
      }

      // Find the invoice
      const invoice = await Invoice.findOne({ booking_id: bookingId });
      if (!invoice) throw createHttpError(400, 'Invoice must be generated before checkout');

      if (invoice.status !== 'Paid') {
        invoice.status = 'Paid';
        invoice.payment_method = paymentMethod;
        invoice.payment_date = new Date();
        await invoice.save();
      }

      // Update Booking
      booking.booking_status = 'CheckedOut';
      booking.payment_status = 'Paid';
      await booking.save();

      // Update BookingRooms
      await BookingRoom.updateMany(
        { booking_id: bookingId },
        { status: 'CheckedOut' }
      );

      // Update actual Rooms to Available (or Needs Cleaning)
      const bookingRooms = await BookingRoom.find({ booking_id: bookingId });
      const roomIds = bookingRooms.map(br => br.room_id).filter(Boolean);
      
      // Update actual Rooms to 'Dirty' so Housekeeping can clean it (SOP UC-023)
      await Room.updateMany(
        { _id: { $in: roomIds } },
        { status: 'Dirty' }
      );



      return { booking, invoice };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = checkoutService;
