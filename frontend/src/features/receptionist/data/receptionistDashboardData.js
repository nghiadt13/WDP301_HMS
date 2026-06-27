export const menuItems = [
  ['View Booking List', 'booking'],
  ['View Booking Detail', 'file'],
  ['Create Walk-in Booking', 'plus'],
  ['Modify Booking', 'booking'],
  ['Cancel Booking', 'booking'],
  ['Record Deposit Payment', 'wallet'],
  ['Process Check-in', 'check'],
  ['Assign Room', 'bed'],
  ['Process Check-out', 'arrow'],
  ['Create Room Inspection Request', 'file'],
  ['View Inspection Result', 'file'],
  ['Add Charge to Bill', 'wallet'],
  ['Generate Invoice', 'file'],
  ['Process Final Payment', 'wallet'],
  ['Manage Customer Profile', 'user'],
  ['View Room Status Board', 'bed'],
  ['Handle Customer Service Request', 'message'],
];

export const kpis = [
  ['Today Arrivals', '18', '+4 from yesterday', 'booking', 'primary'],
  ['Checked In', '12', '67% completed', 'check', 'success'],
  ['Pending Check-out', '7', '2 need inspection', 'arrow', 'warning'],
  ['Open Requests', '9', '5 housekeeping', 'message', 'soft'],
];

export const bookings = [
  ['#BK-2041', 'Nguyen Minh Anh', 'Deluxe King', '305', 'Jun 27 - Jun 29', 'Deposit Paid', 'Arriving'],
  ['#BK-2042', 'Tran Quang Huy', 'Superior Twin', '210', 'Jun 27 - Jun 28', 'Unpaid', 'Pending'],
  ['#BK-2043', 'Le Hoang Nam', 'Family Suite', '402', 'Jun 26 - Jun 30', 'Paid', 'Checked In'],
  ['#BK-2044', 'Pham Thu Ha', 'Standard Room', '118', 'Jun 25 - Jun 27', 'Paid', 'Check-out'],
  ['#BK-2045', 'Walk-in Guest', 'Standard Room', '126', 'Jun 27 - Jun 28', 'Counter Deposit', 'Walk-in'],
];

export const roomStatus = [
  ['Available', 42, 'available'],
  ['Occupied', 68, 'occupied'],
  ['Reserved', 21, 'reserved'],
  ['Dirty', 8, 'dirty'],
  ['Maintenance', 4, 'maintenance'],
];

export const quickActions = [
  ['Create Walk-in Booking', 'Create a booking for guests arriving directly at the hotel.', 'plus'],
  ['Record Deposit Payment', 'Record cash or counter deposit for a selected booking.', 'wallet'],
  ['Assign Room', 'Assign a clean and available room to a booking.', 'bed'],
  ['Generate Invoice', 'Prepare invoice after charges and inspection result are confirmed.', 'file'],
];

export const serviceRequests = [
  ['Extra towels requested', 'Room 305', 'Housekeeping'],
  ['Air conditioner issue', 'Room 210', 'Technical'],
  ['Late check-out request', 'Room 118', 'Receptionist'],
];
