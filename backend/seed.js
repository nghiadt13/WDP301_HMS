const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const { ObjectId } = mongoose.Types;
const SEED_TAG = 'hms-demo-seed-v1';

const oid = (value) => new ObjectId(value);
const dt = (value) => new Date(value);

const ids = {
  roles: {
    customer: oid('650000000000000000000001'),
    receptionist: oid('650000000000000000000002'),
    housekeeping: oid('650000000000000000000003'),
    technical: oid('650000000000000000000004'),
    manager: oid('650000000000000000000005'),
    admin: oid('650000000000000000000006')
  },
  users: {
    customer: oid('651000000000000000000001'),
    receptionist: oid('651000000000000000000002'),
    housekeeping: oid('651000000000000000000003'),
    technical: oid('651000000000000000000004'),
    manager: oid('651000000000000000000005'),
    admin: oid('651000000000000000000006')
  },
  roomTypes: {
    deluxe: oid('652000000000000000000001'),
    suite: oid('652000000000000000000002')
  },
  rooms: {
    deluxe101: oid('653000000000000000000001'),
    deluxe102: oid('653000000000000000000002'),
    suite201: oid('653000000000000000000003'),
    suite202: oid('653000000000000000000004')
  },
  amenities: {
    wifi: oid('654000000000000000000001'),
    breakfast: oid('654000000000000000000002'),
    bathtub: oid('654000000000000000000003'),
    poolView: oid('654000000000000000000004'),
    airConditioner: oid('654000000000000000000005')
  },
  roomPricings: {
    deluxeSummer: oid('655000000000000000000001'),
    suiteSummer: oid('655000000000000000000002')
  },
  reservations: {
    upcoming: oid('656000000000000000000001'),
    active: oid('656000000000000000000002'),
    completed: oid('656000000000000000000003')
  },
  invoices: {
    upcoming: oid('657000000000000000000001'),
    active: oid('657000000000000000000002'),
    completed: oid('657000000000000000000003')
  },
  payments: {
    upcomingDeposit: oid('658000000000000000000001'),
    activeDeposit: oid('658000000000000000000002'),
    completedFinal: oid('658000000000000000000003')
  },
  services: {
    towels: oid('659000000000000000000001'),
    laundry: oid('659000000000000000000002'),
    taxi: oid('659000000000000000000003'),
    cleaning: oid('659000000000000000000004')
  },
  serviceRequests: {
    towels: oid('65a000000000000000000001'),
    laundry: oid('65a000000000000000000002')
  },
  housekeepingTasks: {
    clean102: oid('65b000000000000000000001'),
    inspect102: oid('65b000000000000000000002')
  },
  technicalRequests: {
    acIssue: oid('65c000000000000000000001')
  },
  maintenanceBlocks: {
    suite202: oid('65d000000000000000000001')
  },
  inspections: {
    completed: oid('65e000000000000000000001')
  },
  minibarItems: {
    water: oid('65f000000000000000000001'),
    snack: oid('65f000000000000000000002')
  },
  inspectionItems: {
    waterUsed: oid('660000000000000000000001'),
    snackUsed: oid('660000000000000000000002')
  },
  invoiceItems: {
    completedRoom: oid('661000000000000000000001'),
    completedMinibar: oid('661000000000000000000002'),
    activeService: oid('661000000000000000000003')
  },
  feedbacks: {
    completed: oid('662000000000000000000001')
  },
  passwordResetTokens: {
    customer: oid('663000000000000000000001')
  },
  notifications: {
    booking: oid('664000000000000000000001'),
    payment: oid('664000000000000000000002'),
    task: oid('664000000000000000000003')
  },
  activityLogs: {
    adminAccount: oid('665000000000000000000001'),
    managerRoom: oid('665000000000000000000002')
  }
};

const withSeedTag = (documents) => documents.map((document) => ({ ...document, _seedTag: SEED_TAG }));

async function syncCollection(collectionName, documents) {
  const collection = mongoose.connection.db.collection(collectionName);
  const documentIds = documents.map((document) => document._id);

  await collection.deleteMany({
    _seedTag: SEED_TAG,
    _id: { $nin: documentIds }
  });

  if (documents.length === 0) {
    return { collectionName, count: 0 };
  }

  await collection.bulkWrite(
    documents.map((document) => ({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true
      }
    })),
    { ordered: true }
  );

  return { collectionName, count: documents.length };
}

async function createIndexes() {
  const db = mongoose.connection.db;

  await Promise.all([
    db.collection('roles').createIndex({ name: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ login_account: 1 }, { unique: true, sparse: true }),
    db.collection('users').createIndex({ role_id: 1 }),
    db.collection('rooms').createIndex({ room_number: 1 }, { unique: true }),
    db.collection('reservations').createIndex({ booking_code: 1 }, { unique: true }),
    db.collection('reservations').createIndex({ customer_id: 1, check_in_date: 1 }),
    db.collection('service_requests').createIndex({ assigned_to_id: 1, status: 1 }),
    db.collection('housekeeping_tasks').createIndex({ assigned_to_id: 1, status: 1 }),
    db.collection('technical_requests').createIndex({ assigned_to_id: 1, status: 1 }),
    db.collection('payments').createIndex({ reservation_id: 1 }),
    db.collection('invoices').createIndex({ reservation_id: 1 }),
    db.collection('notifications').createIndex({ user_id: 1, created_at: -1 }),
    db.collection('activity_logs').createIndex({ actor_id: 1, created_at: -1 })
  ]);
}

async function buildSeedData() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const roles = withSeedTag([
    {
      _id: ids.roles.customer,
      name: 'Customer',
      permission_sets: ['room:view', 'reservation:create', 'reservation:self', 'service:request', 'feedback:create'],
      is_active: true
    },
    {
      _id: ids.roles.receptionist,
      name: 'Receptionist',
      permission_sets: ['booking:manage', 'checkin:manage', 'checkout:manage', 'invoice:manage', 'payment:manage'],
      is_active: true
    },
    {
      _id: ids.roles.housekeeping,
      name: 'Housekeeping',
      permission_sets: ['housekeeping_task:view', 'housekeeping_task:update', 'inspection:manage', 'service_request:update'],
      is_active: true
    },
    {
      _id: ids.roles.technical,
      name: 'Technical Staff',
      permission_sets: ['technical_request:view', 'technical_request:update'],
      is_active: true
    },
    {
      _id: ids.roles.manager,
      name: 'Manager',
      permission_sets: ['room:manage', 'room_type:manage', 'staff_task:manage', 'report:view', 'feedback:manage'],
      is_active: true
    },
    {
      _id: ids.roles.admin,
      name: 'Admin',
      permission_sets: ['account:manage', 'role:manage', 'password:reset', 'activity_log:view'],
      is_active: true
    }
  ]);

  const users = withSeedTag([
    {
      _id: ids.users.customer,
      role_id: ids.roles.customer,
      email: 'customer@hotelify.test',
      login_account: 'customer01',
      password_hash: passwordHash,
      full_name: 'Nguyen Van Customer',
      phone_number: '0901000001',
      id_card_number: '079201000001',
      passport_number: null,
      address: 'Quan 1, Ho Chi Minh City',
      avatar: '',
      status: 'active',
      auth_provider: 'local',
      google_id: null,
      email_verified: true
    },
    {
      _id: ids.users.receptionist,
      role_id: ids.roles.receptionist,
      email: 'receptionist@hotelify.test',
      login_account: 'receptionist01',
      password_hash: passwordHash,
      full_name: 'Tran Thi Receptionist',
      phone_number: '0901000002',
      id_card_number: '079201000002',
      passport_number: null,
      address: 'Front Desk Department',
      avatar: '',
      status: 'active',
      auth_provider: 'local',
      google_id: null,
      email_verified: true
    },
    {
      _id: ids.users.housekeeping,
      role_id: ids.roles.housekeeping,
      email: 'housekeeping@hotelify.test',
      login_account: 'housekeeping01',
      password_hash: passwordHash,
      full_name: 'Le Van Housekeeping',
      phone_number: '0901000003',
      id_card_number: '079201000003',
      passport_number: null,
      address: 'Housekeeping Department',
      avatar: '',
      status: 'active',
      auth_provider: 'local',
      google_id: null,
      email_verified: true
    },
    {
      _id: ids.users.technical,
      role_id: ids.roles.technical,
      email: 'technical@hotelify.test',
      login_account: 'technical01',
      password_hash: passwordHash,
      full_name: 'Pham Van Technical',
      phone_number: '0901000004',
      id_card_number: '079201000004',
      passport_number: null,
      address: 'Technical Department',
      avatar: '',
      status: 'active',
      auth_provider: 'local',
      google_id: null,
      email_verified: true
    },
    {
      _id: ids.users.manager,
      role_id: ids.roles.manager,
      email: 'manager@hotelify.test',
      login_account: 'manager01',
      password_hash: passwordHash,
      full_name: 'Hoang Hotel Manager',
      phone_number: '0901000005',
      id_card_number: '079201000005',
      passport_number: null,
      address: 'Management Office',
      avatar: '',
      status: 'active',
      auth_provider: 'local',
      google_id: null,
      email_verified: true
    },
    {
      _id: ids.users.admin,
      role_id: ids.roles.admin,
      email: 'admin@hotelify.test',
      login_account: 'admin01',
      password_hash: passwordHash,
      full_name: 'System Admin',
      phone_number: '0901000006',
      id_card_number: '079201000006',
      passport_number: null,
      address: 'IT Department',
      avatar: '',
      status: 'active',
      auth_provider: 'local',
      google_id: null,
      email_verified: true
    }
  ]);

  const roomTypes = withSeedTag([
    {
      _id: ids.roomTypes.deluxe,
      name: 'Deluxe Double Room',
      capacity: 2,
      bed_type: '1 King Bed',
      base_price: 1200000,
      images: ['/rooms/deluxe-1.jpg', '/rooms/deluxe-2.jpg'],
      description: 'Comfortable room for couples or business guests.',
      is_active: true
    },
    {
      _id: ids.roomTypes.suite,
      name: 'Executive Suite',
      capacity: 4,
      bed_type: '2 Queen Beds',
      base_price: 2500000,
      images: ['/rooms/suite-1.jpg', '/rooms/suite-2.jpg'],
      description: 'Spacious suite with living area and premium amenities.',
      is_active: true
    }
  ]);

  const amenities = withSeedTag([
    { _id: ids.amenities.wifi, name: 'Free Wi-Fi', description: 'High-speed wireless internet.', is_active: true },
    { _id: ids.amenities.breakfast, name: 'Breakfast Included', description: 'Daily buffet breakfast.', is_active: true },
    { _id: ids.amenities.bathtub, name: 'Bathtub', description: 'Private bathtub in bathroom.', is_active: true },
    { _id: ids.amenities.poolView, name: 'Pool View', description: 'Room window faces swimming pool.', is_active: true },
    { _id: ids.amenities.airConditioner, name: 'Air Conditioner', description: 'In-room air conditioning.', is_active: true }
  ]);

  const roomTypeAmenities = withSeedTag([
    { _id: oid('666000000000000000000001'), room_type_id: ids.roomTypes.deluxe, amenity_id: ids.amenities.wifi },
    { _id: oid('666000000000000000000002'), room_type_id: ids.roomTypes.deluxe, amenity_id: ids.amenities.breakfast },
    { _id: oid('666000000000000000000003'), room_type_id: ids.roomTypes.deluxe, amenity_id: ids.amenities.airConditioner },
    { _id: oid('666000000000000000000004'), room_type_id: ids.roomTypes.suite, amenity_id: ids.amenities.wifi },
    { _id: oid('666000000000000000000005'), room_type_id: ids.roomTypes.suite, amenity_id: ids.amenities.breakfast },
    { _id: oid('666000000000000000000006'), room_type_id: ids.roomTypes.suite, amenity_id: ids.amenities.bathtub },
    { _id: oid('666000000000000000000007'), room_type_id: ids.roomTypes.suite, amenity_id: ids.amenities.poolView }
  ]);

  const roomPricings = withSeedTag([
    {
      _id: ids.roomPricings.deluxeSummer,
      room_type_id: ids.roomTypes.deluxe,
      rule_name: 'Summer Weekend Rate',
      start_date: dt('2026-07-01T00:00:00.000Z'),
      end_date: dt('2026-08-31T23:59:59.000Z'),
      price: 1500000,
      is_active: true
    },
    {
      _id: ids.roomPricings.suiteSummer,
      room_type_id: ids.roomTypes.suite,
      rule_name: 'Summer Weekend Rate',
      start_date: dt('2026-07-01T00:00:00.000Z'),
      end_date: dt('2026-08-31T23:59:59.000Z'),
      price: 3100000,
      is_active: true
    }
  ]);

  const rooms = withSeedTag([
    { _id: ids.rooms.deluxe101, room_type_id: ids.roomTypes.deluxe, room_number: '101', floor: '1', status: 'Available', is_active: true },
    { _id: ids.rooms.deluxe102, room_type_id: ids.roomTypes.deluxe, room_number: '102', floor: '1', status: 'Dirty', is_active: true },
    { _id: ids.rooms.suite201, room_type_id: ids.roomTypes.suite, room_number: '201', floor: '2', status: 'Occupied', is_active: true },
    { _id: ids.rooms.suite202, room_type_id: ids.roomTypes.suite, room_number: '202', floor: '2', status: 'Maintenance', is_active: true }
  ]);

  const maintenanceBlocks = withSeedTag([
    {
      _id: ids.maintenanceBlocks.suite202,
      room_id: ids.rooms.suite202,
      start_time: dt('2026-06-20T02:00:00.000Z'),
      end_time: dt('2026-06-28T10:00:00.000Z'),
      reason: 'Air conditioner replacement'
    }
  ]);

  const reservations = withSeedTag([
    {
      _id: ids.reservations.upcoming,
      booking_code: 'HMS-20260701-001',
      customer_id: ids.users.customer,
      room_type_id: ids.roomTypes.deluxe,
      room_id: ids.rooms.deluxe101,
      check_in_date: dt('2026-07-01T07:00:00.000Z'),
      check_out_date: dt('2026-07-03T05:00:00.000Z'),
      guest_count: 2,
      special_request: 'High floor if available',
      total_amount: 3000000,
      deposit_amount: 900000,
      payment_status: 'DepositPaid',
      booking_status: 'Confirmed',
      created_at: dt('2026-06-24T04:00:00.000Z')
    },
    {
      _id: ids.reservations.active,
      booking_code: 'HMS-20260624-002',
      customer_id: ids.users.customer,
      room_type_id: ids.roomTypes.suite,
      room_id: ids.rooms.suite201,
      check_in_date: dt('2026-06-24T07:00:00.000Z'),
      check_out_date: dt('2026-06-27T05:00:00.000Z'),
      guest_count: 3,
      special_request: 'Extra pillows',
      total_amount: 7500000,
      deposit_amount: 2000000,
      payment_status: 'DepositPaid',
      booking_status: 'CheckedIn',
      created_at: dt('2026-06-20T03:30:00.000Z')
    },
    {
      _id: ids.reservations.completed,
      booking_code: 'HMS-20260610-003',
      customer_id: ids.users.customer,
      room_type_id: ids.roomTypes.deluxe,
      room_id: ids.rooms.deluxe102,
      check_in_date: dt('2026-06-10T07:00:00.000Z'),
      check_out_date: dt('2026-06-12T05:00:00.000Z'),
      guest_count: 2,
      special_request: '',
      total_amount: 2400000,
      deposit_amount: 800000,
      payment_status: 'Paid',
      booking_status: 'CheckedOut',
      created_at: dt('2026-06-01T02:00:00.000Z')
    }
  ]);

  const invoices = withSeedTag([
    {
      _id: ids.invoices.upcoming,
      reservation_id: ids.reservations.upcoming,
      room_charges: 3000000,
      service_fees: 0,
      minibar_charges: 0,
      damage_fees: 0,
      discounts: 0,
      tax_amount: 300000,
      final_payable_amount: 3300000,
      status: 'Draft',
      created_at: dt('2026-06-24T04:05:00.000Z')
    },
    {
      _id: ids.invoices.active,
      reservation_id: ids.reservations.active,
      room_charges: 7500000,
      service_fees: 50000,
      minibar_charges: 0,
      damage_fees: 0,
      discounts: 0,
      tax_amount: 755000,
      final_payable_amount: 8305000,
      status: 'Open',
      created_at: dt('2026-06-24T07:15:00.000Z')
    },
    {
      _id: ids.invoices.completed,
      reservation_id: ids.reservations.completed,
      room_charges: 2400000,
      service_fees: 0,
      minibar_charges: 70000,
      damage_fees: 0,
      discounts: 100000,
      tax_amount: 237000,
      final_payable_amount: 2607000,
      status: 'Paid',
      created_at: dt('2026-06-12T05:30:00.000Z')
    }
  ]);

  const invoiceItems = withSeedTag([
    {
      _id: ids.invoiceItems.completedRoom,
      invoice_id: ids.invoices.completed,
      item_type: 'RoomCharge',
      reference_id: ids.reservations.completed,
      description: 'Deluxe Double Room, 2 nights',
      amount: 2400000,
      quantity: 1
    },
    {
      _id: ids.invoiceItems.completedMinibar,
      invoice_id: ids.invoices.completed,
      item_type: 'Minibar',
      reference_id: ids.inspectionItems.waterUsed,
      description: 'Minibar usage after room inspection',
      amount: 70000,
      quantity: 1
    },
    {
      _id: ids.invoiceItems.activeService,
      invoice_id: ids.invoices.active,
      item_type: 'Service',
      reference_id: ids.serviceRequests.towels,
      description: 'Extra towels service request',
      amount: 50000,
      quantity: 1
    }
  ]);

  const payments = withSeedTag([
    {
      _id: ids.payments.upcomingDeposit,
      reservation_id: ids.reservations.upcoming,
      invoice_id: ids.invoices.upcoming,
      payment_method: 'BankTransfer',
      amount: 900000,
      transaction_id: 'TXN-DEPOSIT-001',
      status: 'Completed',
      paid_at: dt('2026-06-24T04:10:00.000Z')
    },
    {
      _id: ids.payments.activeDeposit,
      reservation_id: ids.reservations.active,
      invoice_id: ids.invoices.active,
      payment_method: 'Cash',
      amount: 2000000,
      transaction_id: 'CASH-DEPOSIT-002',
      status: 'Completed',
      paid_at: dt('2026-06-24T07:20:00.000Z')
    },
    {
      _id: ids.payments.completedFinal,
      reservation_id: ids.reservations.completed,
      invoice_id: ids.invoices.completed,
      payment_method: 'CreditCard',
      amount: 2607000,
      transaction_id: 'CARD-FINAL-003',
      status: 'Completed',
      paid_at: dt('2026-06-12T05:45:00.000Z')
    }
  ]);

  const services = withSeedTag([
    { _id: ids.services.towels, name: 'Extra Towels', description: 'Additional towel set delivered to room.', price: 50000, operating_hours: '24/7', conditions: 'Available for in-house guests', is_active: true },
    { _id: ids.services.laundry, name: 'Laundry', description: 'Laundry pickup and return service.', price: 120000, operating_hours: '08:00-20:00', conditions: 'Same-day return before 18:00', is_active: true },
    { _id: ids.services.taxi, name: 'Airport Taxi', description: 'Taxi booking to airport.', price: 450000, operating_hours: '24/7', conditions: 'Book 2 hours in advance', is_active: true },
    { _id: ids.services.cleaning, name: 'Urgent Cleaning', description: 'Urgent room cleaning service.', price: 0, operating_hours: '08:00-22:00', conditions: 'Subject to housekeeping availability', is_active: true }
  ]);

  const serviceRequests = withSeedTag([
    {
      _id: ids.serviceRequests.towels,
      reservation_id: ids.reservations.active,
      service_id: ids.services.towels,
      assigned_to_id: ids.users.housekeeping,
      quantity: 1,
      request_details: 'Guest requests one additional towel set.',
      status: 'Completed',
      requested_time: dt('2026-06-24T10:00:00.000Z')
    },
    {
      _id: ids.serviceRequests.laundry,
      reservation_id: ids.reservations.active,
      service_id: ids.services.laundry,
      assigned_to_id: ids.users.housekeeping,
      quantity: 2,
      request_details: 'Laundry pickup from room 201.',
      status: 'Pending',
      requested_time: dt('2026-06-24T11:00:00.000Z')
    }
  ]);

  const housekeepingTasks = withSeedTag([
    {
      _id: ids.housekeepingTasks.clean102,
      room_id: ids.rooms.deluxe102,
      assigned_to_id: ids.users.housekeeping,
      task_type: 'Cleaning',
      priority: 'High',
      status: 'InProgress',
      notes: 'Clean room after guest check-out.',
      deadline: dt('2026-06-24T13:00:00.000Z')
    },
    {
      _id: ids.housekeepingTasks.inspect102,
      room_id: ids.rooms.deluxe102,
      assigned_to_id: ids.users.housekeeping,
      task_type: 'Inspection',
      priority: 'Medium',
      status: 'Completed',
      notes: 'Inspection after check-out completed.',
      deadline: dt('2026-06-12T05:20:00.000Z')
    }
  ]);

  const technicalRequests = withSeedTag([
    {
      _id: ids.technicalRequests.acIssue,
      room_id: ids.rooms.suite202,
      reported_by_id: ids.users.housekeeping,
      assigned_to_id: ids.users.technical,
      category: 'AirConditioner',
      issue_description: 'Air conditioner does not cool the room.',
      priority: 'High',
      status: 'InProgress'
    }
  ]);

  const roomInspections = withSeedTag([
    {
      _id: ids.inspections.completed,
      reservation_id: ids.reservations.completed,
      room_id: ids.rooms.deluxe102,
      inspected_by_id: ids.users.housekeeping,
      room_condition: 'Good',
      damage_report: 'No damage found.',
      lost_items: 'None',
      inspected_at: dt('2026-06-12T05:15:00.000Z')
    }
  ]);

  const minibarItems = withSeedTag([
    { _id: ids.minibarItems.water, name: 'Mineral Water', category: 'Drink', price: 20000, stock_quantity: 100, description: '500ml bottle', is_active: true },
    { _id: ids.minibarItems.snack, name: 'Chocolate Snack', category: 'Snack', price: 50000, stock_quantity: 80, description: 'Premium chocolate bar', is_active: true }
  ]);

  const inspectionItems = withSeedTag([
    {
      _id: ids.inspectionItems.waterUsed,
      inspection_id: ids.inspections.completed,
      minibar_item_id: ids.minibarItems.water,
      quantity_consumed: 1,
      charge_amount: 20000,
      item_type: 'Minibar',
      note: 'One bottle consumed.'
    },
    {
      _id: ids.inspectionItems.snackUsed,
      inspection_id: ids.inspections.completed,
      minibar_item_id: ids.minibarItems.snack,
      quantity_consumed: 1,
      charge_amount: 50000,
      item_type: 'Minibar',
      note: 'One snack consumed.'
    }
  ]);

  const feedbacks = withSeedTag([
    {
      _id: ids.feedbacks.completed,
      reservation_id: ids.reservations.completed,
      customer_id: ids.users.customer,
      rating: 5,
      feedback_text: 'Great service and clean room.',
      response_text: 'Thank you for staying with Hotelify.',
      status: 'Responded',
      submitted_at: dt('2026-06-13T03:00:00.000Z')
    }
  ]);

  const passwordResetTokens = withSeedTag([
    {
      _id: ids.passwordResetTokens.customer,
      user_id: ids.users.customer,
      token_hash: 'demo-reset-token-hash-not-for-production',
      expires_at: dt('2026-06-25T04:00:00.000Z'),
      used_at: null,
      created_at: dt('2026-06-24T04:00:00.000Z')
    }
  ]);

  const notifications = withSeedTag([
    {
      _id: ids.notifications.booking,
      user_id: ids.users.customer,
      type: 'BookingConfirmation',
      title: 'Booking confirmed',
      message: 'Your reservation HMS-20260701-001 has been confirmed.',
      channel: 'Email',
      status: 'Sent',
      sent_at: dt('2026-06-24T04:11:00.000Z'),
      created_at: dt('2026-06-24T04:10:30.000Z')
    },
    {
      _id: ids.notifications.payment,
      user_id: ids.users.customer,
      type: 'PaymentReceipt',
      title: 'Deposit payment received',
      message: 'We received your deposit payment for booking HMS-20260701-001.',
      channel: 'Email',
      status: 'Sent',
      sent_at: dt('2026-06-24T04:12:00.000Z'),
      created_at: dt('2026-06-24T04:11:30.000Z')
    },
    {
      _id: ids.notifications.task,
      user_id: ids.users.housekeeping,
      type: 'TaskAssignment',
      title: 'New laundry request',
      message: 'Laundry request assigned for room 201.',
      channel: 'InApp',
      status: 'Unread',
      sent_at: null,
      created_at: dt('2026-06-24T11:00:30.000Z')
    }
  ]);

  const activityLogs = withSeedTag([
    {
      _id: ids.activityLogs.adminAccount,
      actor_id: ids.users.admin,
      action: 'CREATE_INTERNAL_ACCOUNT',
      target_type: 'USER',
      target_id: ids.users.receptionist,
      metadata: { role: 'Receptionist' },
      created_at: dt('2026-06-20T03:00:00.000Z')
    },
    {
      _id: ids.activityLogs.managerRoom,
      actor_id: ids.users.manager,
      action: 'UPDATE_ROOM_STATUS',
      target_type: 'ROOM',
      target_id: ids.rooms.suite202,
      metadata: { from: 'Available', to: 'Maintenance' },
      created_at: dt('2026-06-20T02:00:00.000Z')
    }
  ]);

  return [
    ['roles', roles],
    ['users', users],
    ['password_reset_tokens', passwordResetTokens],
    ['notifications', notifications],
    ['activity_logs', activityLogs],
    ['room_types', roomTypes],
    ['amenities', amenities],
    ['room_type_amenities', roomTypeAmenities],
    ['room_pricings', roomPricings],
    ['rooms', rooms],
    ['maintenance_blocks', maintenanceBlocks],
    ['reservations', reservations],
    ['invoices', invoices],
    ['invoice_items', invoiceItems],
    ['payments', payments],
    ['services', services],
    ['service_requests', serviceRequests],
    ['housekeeping_tasks', housekeepingTasks],
    ['technical_requests', technicalRequests],
    ['room_inspections', roomInspections],
    ['minibar_items', minibarItems],
    ['inspection_items', inspectionItems],
    ['feedbacks', feedbacks]
  ];
}

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Please add it to backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);

  const collections = await buildSeedData();
  for (const [collectionName, documents] of collections) {
    const result = await syncCollection(collectionName, documents);
    console.log(`Seeded ${result.count.toString().padStart(2, ' ')} document(s) into ${collectionName}`);
  }

  await createIndexes();
  console.log('Indexes are ready');

  console.log('\nDemo login accounts');
  console.log('Password for all accounts: Password@123');
  console.log('- customer01');
  console.log('- receptionist01');
  console.log('- housekeeping01');
  console.log('- technical01');
  console.log('- manager01');
  console.log('- admin01');
}

seed()
  .catch((error) => {
    console.error('Database seed failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
