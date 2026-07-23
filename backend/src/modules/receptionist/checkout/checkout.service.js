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

const normalizeInspectionChargeItems = (inspection) => {
  if (!inspection) return [];

  const damagedItems = Array.isArray(inspection.damaged_items) ? inspection.damaged_items : [];
  const missingItems = Array.isArray(inspection.missing_items) ? inspection.missing_items : [];

  return [...damagedItems, ...missingItems].map((item, index) => {
    const estimated = Number(item?.estimated_compensation_amount || 0);
    const approved = item?.approved_compensation_amount === null || item?.approved_compensation_amount === undefined
      ? estimated
      : Number(item.approved_compensation_amount || 0);

    return {
      id: item?.id || `${inspection._id || 'inspection'}-${index}`,
      name: item?.name || 'Damage item',
      type: item?.type || (damagedItems.includes(item) ? 'damaged' : 'missing'),
      quantity: Number(item?.quantity || 1),
      severity: item?.severity || 'minor',
      description: item?.description || item?.note || '',
      note: item?.note || item?.description || '',
      estimated_compensation_amount: estimated,
      approved_compensation_amount: approved,
      photos: Array.isArray(item?.photos) ? item.photos : [],
    };
  });
};

const sumRoomInventoryTotal = (inspection) => {
  if (!inspection) return 0;
  const savedTotal = Number(inspection.room_inventory_total || 0);
  if (savedTotal > 0) {
    return savedTotal;
  }

  const sourceItems = Array.isArray(inspection.invoice_items) && inspection.invoice_items.length > 0
    ? inspection.invoice_items
    : Array.isArray(inspection.room_inventory)
      ? inspection.room_inventory
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

const buildApprovedRoomInventoryState = (inspectionState) => {
  const rooms = (inspectionState?.rooms || []).map((room) => {
    const items = room?.roomInventoryReport?.items || [];
    const total = items.reduce((sum, item) => sum + Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0))), 0);

    return {
      ...room,
      roomInventoryReport: {
        items,
        total,
      },
    };
  });

  return {
    rooms,
    total: rooms.reduce((sum, room) => sum + Number(room?.roomInventoryReport?.total || 0), 0),
  };
};

const buildApprovedDamageState = (inspectionState) => {
  const rooms = (inspectionState?.rooms || []).map((room) => {
    const items = room?.damageMissingReport?.items || [];
    const total = items.reduce((sum, item) => sum + Number(item.approved_compensation_amount || 0), 0);

    return {
      ...room,
      damageMissingReport: {
        items,
        total,
      },
    };
  });

  return {
    rooms,
    total: rooms.reduce((sum, room) => sum + Number(room?.damageMissingReport?.total || 0), 0),
  };
};

const buildInspectionState = async (bookingId) => {
  const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
  const roomEntries = rooms
    .map((room) => ({
      roomId: room.room_id ? room.room_id._id : null,
      roomNumber: room.room_id ? room.room_id.roomName : room.room_number,
    }))
    .filter((room) => room.roomNumber);
  const roomNames = roomEntries.map((room) => room.roomNumber);

  const requestedTasks = await StaffTask.find({
    booking_id: bookingId,
    room_number: { $in: roomNames },
    cleaningType: 'Inspection Review',
  })
    .sort({ createdAt: -1 })
    .lean();

  const taskIds = requestedTasks.map((task) => task._id).filter(Boolean);
  const inspections = taskIds.length ? await Inspection.find({ task_id: { $in: taskIds } })
    .sort({ createdAt: -1 })
    .lean() : [];

  const tasksByRoom = new Map();
  requestedTasks.forEach((task) => {
    const roomTasks = tasksByRoom.get(task.room_number) || [];
    roomTasks.push(task);
    tasksByRoom.set(task.room_number, roomTasks);
  });

  const latestInspectionByTask = new Map();
  inspections.forEach((inspection) => {
    const taskId = inspection.task_id ? String(inspection.task_id) : '';
    if (taskId && !latestInspectionByTask.has(taskId)) {
      latestInspectionByTask.set(taskId, inspection);
    }
  });

  const roomsState = roomEntries.map(({ roomId, roomNumber }) => {
    const roomTasks = tasksByRoom.get(roomNumber) || [];
    const latestTask = roomTasks[0] || null;
    const latestTaskRequestedAt = latestTask?.createdAt ? new Date(latestTask.createdAt).getTime() : null;
    const confirmedReports = roomTasks
      .map((candidateTask) => {
        const candidateTaskId = candidateTask?._id ? String(candidateTask._id) : '';
        const candidateInspection = candidateTaskId ? latestInspectionByTask.get(candidateTaskId) || null : null;
        const candidateRequestedAt = candidateTask?.createdAt ? new Date(candidateTask.createdAt).getTime() : null;
        const candidateInspectedAt = candidateInspection?.createdAt ? new Date(candidateInspection.createdAt).getTime() : null;
        const candidateTaskStatus = String(candidateTask?.status || '').trim().toLowerCase();
        const candidateInspectionStatus = String(candidateInspection?.status || '').trim().toLowerCase();
        const candidateInspectionTaskId = candidateInspection?.task_id ? String(candidateInspection.task_id) : '';
        const inspectionMatchesTask = Boolean(candidateTaskId && candidateInspectionTaskId && candidateInspectionTaskId === candidateTaskId);
        const isConfirmed = Boolean(
          candidateTask
          && candidateInspection
          && candidateTaskStatus === 'completed'
          && ['submitted', 'completed'].includes(candidateInspectionStatus)
          && inspectionMatchesTask
          && candidateInspectedAt !== null
          && candidateRequestedAt !== null
          && candidateInspectedAt >= candidateRequestedAt
          && (latestTaskRequestedAt === null || candidateInspectedAt >= latestTaskRequestedAt)
        );

        return {
          task: candidateTask,
          inspection: candidateInspection,
          inspectedAt: candidateInspectedAt || 0,
          isConfirmed,
        };
      })
      .filter((entry) => entry.isConfirmed)
      .sort((first, second) => second.inspectedAt - first.inspectedAt);

    const confirmedReport = confirmedReports[0] || null;
    const task = confirmedReport?.task || latestTask;
    const taskId = task?._id ? String(task._id) : '';
    const inspection = confirmedReport?.inspection || (taskId ? latestInspectionByTask.get(taskId) || null : null);
    const inspectionConfirmed = Boolean(confirmedReport);
    const inspectionInventoryItems = Array.isArray(inspection?.room_inventory) ? inspection.room_inventory : [];
    const invoiceItems = Array.isArray(inspection?.invoice_items) ? inspection.invoice_items : [];
    const sourceInventoryItems = inspectionInventoryItems.length > 0 ? inspectionInventoryItems : invoiceItems;
    const roomInventoryItems = sourceInventoryItems.length > 0
      ? sourceInventoryItems.map((item, index) => {
        const invoiceItem = invoiceItems[index] || {};
        const quantity = Number(item.qty ?? item.quantity ?? invoiceItem.quantity ?? 1);
        const unitPrice = Number(item.price ?? item.unit_price ?? invoiceItem.unit_price ?? 0);
        const total = Number(item.total ?? invoiceItem.total ?? (quantity * unitPrice));
        return {
          item_id: item.item_id || invoiceItem.item_id || null,
          name: item.item || item.name || invoiceItem.name || 'Room inventory item',
          quantity,
          unit_price: unitPrice,
          total,
          note: item.note || invoiceItem.note || 'Room inventory usage recorded during inspection',
        };
      })
      : [];
    const roomInventoryTotal = sumRoomInventoryTotal(inspection);
    const damageItems = normalizeInspectionChargeItems(inspection);
    const damageTotal = damageItems.reduce((sum, item) => sum + Number(item.approved_compensation_amount || 0), 0);

    return {
      roomNumber,
      roomId,
      task,
      inspection,
      inspectionConfirmed,
      roomInventoryReport: {
        items: roomInventoryItems,
        total: roomInventoryTotal,
      },
      damageMissingReport: {
        items: damageItems,
        total: damageTotal,
      },
    };
  });

  return {
    rooms: roomsState,
    tasks: roomsState
      .filter((entry) => entry.task)
      .map(({ roomNumber, roomId, task, inspection, inspectionConfirmed, roomInventoryReport }) => ({
        ...task,
        room_number: roomNumber,
        room_id: roomId,
        inspectionConfirmed,
        inspectionId: inspection?._id || null,
        inspectionStatus: inspection?.status || null,
        confirmedAt: inspection?.createdAt || null,
        inspectionNote: inspection?.note || inspection?.remarks || '',
        roomInventoryReport,
      })),
    allRoomsConfirmed: roomsState.length > 0 && roomsState.every((entry) => entry.inspectionConfirmed),
    pendingRooms: roomsState
      .filter((entry) => !entry.inspectionConfirmed)
      .map((entry) => entry.roomNumber),
  };
};

const syncRoomInventoryChargesFromInspection = async (bookingId, inspectionState) => {
  const approvedRoomInventory = buildApprovedRoomInventoryState(inspectionState);
  const confirmedRooms = approvedRoomInventory.rooms.filter((room) => room.inspectionConfirmed);

  for (const room of confirmedRooms) {
    const roomInventoryItems = room?.roomInventoryReport?.items || [];
    for (const item of roomInventoryItems) {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const amount = Number(item.total || (quantity * unitPrice));
      if (quantity <= 0 || unitPrice <= 0 || amount <= 0) continue;

      const roomInventoryItemId = item.item_id || null;
      const description = `${item.name || 'Room inventory item'} x${quantity}${room.roomNumber ? ` (${room.roomNumber})` : ''}`;
      const chargeFilter = {
        booking_id: bookingId,
        room_id: room.roomId || null,
        charge_type: 'room_inventory',
        description,
      };

      if (roomInventoryItemId) {
        chargeFilter.room_inventory_item_id = roomInventoryItemId;
      }

      await BookingCharge.findOneAndUpdate(
        chargeFilter,
        {
          $set: {
            booking_id: bookingId,
            room_id: room.roomId || null,
            room_inventory_item_id: roomInventoryItemId,
            quantity,
            unit_price: unitPrice,
            description,
            amount,
            charge_type: 'room_inventory',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
};

const mapRoomInventoryForCheckout = (room) => {
  if (!room || !Array.isArray(room.room_inventory)) return [];
  return room.room_inventory
    .map((entry) => {
      const item = entry.item_id;
      if (!item) return null;
      return {
        item_id: item._id || item,
        name: item.name || 'Vật tư phòng',
        category: item.category || '',
        price: Number(item.price || 0),
        quantity: Number(entry.quantity || 0),
        is_active: item.is_active !== false,
      };
    })
    .filter((entry) => entry && entry.is_active);
};

const checkoutService = {
  getCheckoutSummary: async (bookingId) => {
    const booking = await Booking.findById(bookingId).populate('customer_id', 'full_name email phone_number');
    if (!booking) throw createHttpError('Booking not found', 404);

    const rooms = await BookingRoom.find({ booking_id: bookingId })
      .populate({
        path: 'room_id',
        select: 'roomName room_inventory',
        populate: {
          path: 'room_inventory.item_id',
          select: 'name category price is_active'
        }
    });
    const stayGuests = await StayGuest.find({ booking_id: bookingId });
    let charges = await BookingCharge.find({ booking_id: bookingId });

    const inspectionState = await buildInspectionState(bookingId);
    if (inspectionState.allRoomsConfirmed) {
      await syncRoomInventoryChargesFromInspection(bookingId, inspectionState);
      charges = await BookingCharge.find({ booking_id: bookingId });
    }
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
        status: r.status,
        roomInventory: mapRoomInventoryForCheckout(r.room_id)
      })),
      stayGuests,
      charges,
      inspectionState: {
        ...inspectionState,
        approvedDamageTotal: inspectionState.rooms.reduce((sum, room) => sum + Number(room?.damageMissingReport?.total || 0), 0),
      },
      invoice: invoices.length > 0 ? invoices[0] : null
    };
  },

  createInspectionRequest: async (bookingId, taskData, user) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw createHttpError('Booking not found', 404);

    const task = new StaffTask({
      title: `Kiểm tra phòng ${taskData.room_number} (Check-out)`,
      description: taskData.description || `Kiểm tra tình trạng phòng ${taskData.room_number} sau khi khách trả phòng.`,
      staff_type: 'housekeeping',
      room_number: taskData.room_number,
      booking_id: booking._id,
      priority: taskData.priority || 'medium',
      status: 'Assigned',
      cleaningType: 'Inspection Review',
      task_origin: 'inspection',
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
    if (!booking) throw createHttpError('Booking not found', 404);

    const chargeType = chargeData.charge_type || 'other';
    let chargePayload = {
      booking_id: bookingId,
      room_id: chargeData.room_id || null,
      description: chargeData.description,
      amount: chargeData.amount,
      charge_type: chargeType
    };

    if (chargeType === 'room_inventory') {
      const roomInventoryItemId = String(chargeData.room_inventory_item_id || '').trim();
      const quantity = Number(chargeData.quantity || 0);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw createHttpError('Room inventory quantity must be a positive integer', 400);
      }

      const bookingRoom = await BookingRoom.findOne({
        booking_id: bookingId,
        room_id: chargeData.room_id
      });
      if (!bookingRoom) throw createHttpError('Selected room does not belong to this booking', 400);

      const room = await Room.findById(chargeData.room_id).populate('room_inventory.item_id', 'name category price is_active');
      if (!room) throw createHttpError('Room not found', 404);

      const inventoryEntry = (room.room_inventory || []).find((entry) => String(entry.item_id?._id || entry.item_id) === roomInventoryItemId);
      if (!inventoryEntry || inventoryEntry.item_id?.is_active === false) {
        throw createHttpError('Room inventory item not found in selected room', 404);
      }

      const availableQty = Number(inventoryEntry.quantity || 0);
      if (quantity > availableQty) {
        throw createHttpError(`Số lượng vật tư trong phòng không đủ. Hiện còn ${availableQty}.`, 400);
      }

      const unitPrice = Number(inventoryEntry.item_id?.price || 0);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw createHttpError('Room inventory item does not have a valid price', 400);
      }
      const itemName = inventoryEntry.item_id?.name || 'Vật tư phòng';
      inventoryEntry.quantity = availableQty - quantity;
      await room.save();

      chargePayload = {
        booking_id: bookingId,
        room_id: chargeData.room_id,
        room_inventory_item_id: roomInventoryItemId,
        quantity,
        unit_price: unitPrice,
        description: chargeData.description || `${itemName} x${quantity}`,
        amount: unitPrice * quantity,
        charge_type: 'room_inventory'
      };
    }

    const charge = new BookingCharge({
      ...chargePayload
    });

    await charge.save();

    // If an invoice exists and is unpaid, we might want to update it or delete it so it's regenerated
    await Invoice.findOneAndDelete({ booking_id: bookingId, status: 'Unpaid' });

    return charge;
  },

  removeCharge: async (bookingId, chargeId) => {
    const charge = await BookingCharge.findOneAndDelete({ _id: chargeId, booking_id: bookingId });
    if (!charge) throw createHttpError('Charge not found', 404);

    if (String(charge.charge_type || '').toLowerCase() === 'room_inventory' && charge.room_id && charge.room_inventory_item_id && Number(charge.quantity || 0) > 0) {
      const room = await Room.findById(charge.room_id);
      if (room) {
        const itemId = String(charge.room_inventory_item_id);
        const existingEntry = (room.room_inventory || []).find((entry) => String(entry.item_id) === itemId);
        if (existingEntry) {
          existingEntry.quantity = Number(existingEntry.quantity || 0) + Number(charge.quantity || 0);
        } else {
          room.room_inventory.push({
            item_id: charge.room_inventory_item_id,
            quantity: Number(charge.quantity || 0)
          });
        }
        await room.save();
      }
    }
    
    await Invoice.findOneAndDelete({ booking_id: bookingId, status: 'Unpaid' });
  },

  generateInvoice: async (bookingId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw createHttpError('Booking not found', 404);

    // Check if a paid invoice already exists
    const existingPaid = await Invoice.findOne({ booking_id: bookingId, status: 'Paid' });
    if (existingPaid) return existingPaid;

    const inspectionState = await buildInspectionState(bookingId);
    if (inspectionState.allRoomsConfirmed) {
      await syncRoomInventoryChargesFromInspection(bookingId, inspectionState);
    }
    const approvedDamageState = buildApprovedDamageState(inspectionState);
    const damageChargesTotal = approvedDamageState.total;

    const charges = await BookingCharge.find({ booking_id: bookingId });
    const manualChargesTotal = charges
      .reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  const extraChargesTotal = manualChargesTotal + damageChargesTotal;

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
      if (!booking) throw createHttpError('Booking not found', 404);

      if (booking.booking_status !== 'CheckedIn') {
        throw createHttpError('Booking is not in CheckedIn state', 400);
      }

      const inspectionState = await buildInspectionState(bookingId);
      if (!inspectionState.allRoomsConfirmed) {
        const pendingRoomsLabel = inspectionState.pendingRooms.join(', ');
        throw createHttpError(`Housekeeping must confirm inspection before checkout can continue${pendingRoomsLabel ? ` for room(s): ${pendingRoomsLabel}` : ''}`, 409);
      }
      await syncRoomInventoryChargesFromInspection(bookingId, inspectionState);
      const approvedDamageState = buildApprovedDamageState(inspectionState);

      const rooms = await BookingRoom.find({ booking_id: bookingId }).populate('room_id', 'roomName');
      const roomNames = rooms.map(r => r.room_id ? r.room_id.roomName : r.room_number).filter(Boolean);

      // Find the invoice
      let invoice = await Invoice.findOne({ booking_id: bookingId });
      if (!invoice) {
        invoice = await checkoutService.generateInvoice(bookingId);
      }

      const charges = await BookingCharge.find({ booking_id: bookingId });
      const manualChargesTotal = charges
        .reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
      const damageChargesTotal = approvedDamageState.total;
      const roomCharge = booking.total_amount;
      const subtotal = roomCharge + manualChargesTotal + damageChargesTotal;
      const depositDeducted = booking.deposit_amount || 0;
      const finalTotal = Math.max(0, subtotal - depositDeducted);

      invoice.room_charge = roomCharge;
      invoice.extra_charges = manualChargesTotal + damageChargesTotal;
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

      const maintenanceRooms = new Set(
        (inspectionState.rooms || [])
          .filter((entry) => entry?.inspection?.maintenance_required
            || (entry?.inspection?.damaged_items || []).length
            || (entry?.inspection?.damage || []).length)
          .map((entry) => entry.roomNumber)
      );

      // Mark actual rooms and create post checkout cleaning tasks only for rooms that are not under maintenance.
      const bookingRooms = await BookingRoom.find({ booking_id: bookingId });
      const roomIds = bookingRooms.map(br => br.room_id).filter(Boolean);
      if (roomIds.length) {
        await Promise.all(bookingRooms.map(async (bookingRoom) => {
          if (!bookingRoom.room_id) return;
          const roomNumber = roomNames.find((name) => name === String(bookingRoom.room_number || ''));
          const room = await Room.findById(bookingRoom.room_id);
          if (!room) return;
          const resolvedRoomNumber = room.roomName || roomNumber;
          room.status = maintenanceRooms.has(resolvedRoomNumber) ? 'Maintenance' : 'Dirty';
          await room.save();
        }));
      }

      await Promise.all(
        roomNames
          .filter((roomNumber) => !maintenanceRooms.has(roomNumber))
          .map((roomNumber) => housekeepingService.confirmCheckout({
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
