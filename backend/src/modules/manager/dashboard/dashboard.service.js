const Booking = require('../../../models/booking.model');
const Invoice = require('../../../models/invoice.model');
const Room = require('../../../models/room.model');
const StaffTask = require('../../../models/staffTask.model');
const CustomerFeedback = require('../../../models/customerFeedback.model');
const User = require('../../../models/user.model'); 
const BookingCharge = require('../../../models/booking-charge.model');

const getDashboardStats = async (filter = 'week') => {
  const now = new Date();
  
  // Date ranges based on filter
  const pastRange = new Date(now);
  const futureRange = new Date(now);
  
  if (filter === 'day') {
    pastRange.setHours(0, 0, 0, 0); 
    futureRange.setHours(23, 59, 59, 999); 
  } else if (filter === 'month') {
    pastRange.setMonth(now.getMonth() - 1); 
    futureRange.setHours(23, 59, 59, 999);
  } else {
    pastRange.setDate(now.getDate() - 7); 
    futureRange.setDate(now.getDate() + 7); 
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // 1. KPIs
  // Date filter for revenue (we only look backwards, up to now)
  const revenueEnd = new Date();
  
  const revenueResult = await Invoice.aggregate([
    { $match: { status: 'Paid', created_at: { $gte: pastRange, $lte: revenueEnd } } },
    { $group: { _id: null, total: { $sum: '$final_total' }, roomRevenue: { $sum: '$room_charge' }, extraRevenue: { $sum: '$extra_charges' } } }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;
  const roomRevenue = revenueResult[0]?.roomRevenue || 0;
  const extraRevenue = revenueResult[0]?.extraRevenue || 0;

  const paidInvoices = await Invoice.find({ status: 'Paid', created_at: { $gte: pastRange, $lte: revenueEnd } }).select('booking_id');
  const paidBookingIds = paidInvoices.map(i => i.booking_id);
  const chargesAgg = await BookingCharge.aggregate([
    { $match: { booking_id: { $in: paidBookingIds } } },
    { $group: { _id: "$charge_type", total: { $sum: "$amount" } } }
  ]);
  
  let roomInventoryRevenue = 0, serviceRevenue = 0, otherRevenue = 0;
  chargesAgg.forEach(c => {
    if (c._id === 'room_inventory') roomInventoryRevenue += c.total;
    else if (c._id === 'service') serviceRevenue += c.total;
    else otherRevenue += c.total;
  });

  const newBookings = await Booking.countDocuments({ created_at: { $gte: pastRange } });

  const newBookingsList = await Booking.find({ created_at: { $gte: pastRange } })
    .populate('customer_id', 'full_name')
    .populate('room_type_id', 'typeName')
    .sort({ created_at: -1 })
    .limit(10);

  const checkedInGuests = await Booking.countDocuments({ booking_status: 'CheckedIn' }); // Current stays

  const currentStaysList = await Booking.find({
    booking_status: 'CheckedIn'
  }).populate('customer_id', 'full_name').populate('room_id', 'room_number').sort({ check_in_date: -1 }).limit(10);

  const upcomingArrivals = await Booking.countDocuments({
    booking_status: { $in: ['Pending', 'Confirmed'] },
    check_in_date: { $lte: futureRange }
  });

  const upcomingArrivalsList = await Booking.find({
    booking_status: { $in: ['Pending', 'Confirmed'] },
    check_in_date: { $lte: futureRange }
  }).populate('customer_id', 'full_name').populate('room_type_id', 'typeName').sort({ check_in_date: 1 }).limit(10);

  const upcomingCheckouts = await Booking.countDocuments({
    booking_status: 'CheckedIn',
    check_out_date: { $lte: futureRange }
  });

  const upcomingCheckoutsList = await Booking.find({
    booking_status: 'CheckedIn',
    check_out_date: { $lte: futureRange }
  }).populate('customer_id', 'full_name').populate('room_id', 'room_number').sort({ check_out_date: 1 }).limit(10);

  // 2. Revenue Chart (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const revenueByMonthRaw = await Invoice.aggregate([
    { $match: { status: 'Paid', created_at: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: '$created_at' }, year: { $year: '$created_at' } },
        total: { $sum: '$final_total' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  // Format revenue months to match frontend format
  const months = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
  const revenueByMonth = revenueByMonthRaw.map(item => ({
    label: months[item._id.month - 1],
    total: item.total
  }));

  // 3. Room Status
  const roomStatusCounts = await Room.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const totalRooms = await Room.countDocuments();

  // 4. Booking Sources
  const sourceCounts = await Booking.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);

  // 5. Recent Bookings List (Top 5)
  const recentBookings = await Booking.find()
    .populate('customer_id', 'full_name')
    .populate('room_type_id', 'typeName')
    .sort({ created_at: -1 })
    .limit(5);

  // 6. Recent Tasks
  const recentTasks = await StaffTask.find({ status: { $ne: 'closed' } })
    .sort({ deadline: 1 })
    .limit(4);

  // 7. Feedback Stats
  const feedbackStats = await CustomerFeedback.aggregate([
    { $group: { _id: null, totalCount: { $sum: 1 }, avgRating: { $avg: "$rating" } } }
  ]);
  const totalReviews = feedbackStats[0]?.totalCount || 0;
  const avgRating = feedbackStats[0]?.avgRating ? Number(feedbackStats[0].avgRating.toFixed(1)) : 0;

  // 8. Reserved Rooms (Approximation based on pending/confirmed bookings)
  const reservedRoomsCount = await Booking.countDocuments({
    booking_status: { $in: ['Pending', 'Confirmed'] }
  });

  // 9. Activities
  const recentActivityBookings = await Booking.find().populate('customer_id', 'full_name').sort({ created_at: -1 }).limit(3);
  const recentActivityTasks = await StaffTask.find().sort({ created_at: -1 }).limit(3);

  const activitiesRaw = [
    ...recentActivityBookings.map(b => ({
      user: 'Hệ thống',
      icon: 'user',
      text: `Khách ${b.customer_id?.full_name || 'mới'} đặt phòng ${b.booking_code}`,
      time: b.created_at,
      tone: 'blue'
    })),
    ...recentActivityTasks.map(t => ({
      user: t.staff_type === 'housekeeping' ? 'Buồng phòng' : 'Nhân viên',
      icon: 'sparkle',
      text: `Nhiệm vụ: ${t.title}`,
      time: t.createdAt || t.created_at, // StaffTask uses createdAt
      tone: 'lime'
    }))
  ].sort((a, b) => b.time - a.time).slice(0, 5);

  const activities = activitiesRaw.map(a => ({
    ...a,
    time: new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(a.time))
  }));

  return {
    kpis: {
      totalRevenue,
      roomRevenue,
      extraRevenue,
      roomInventoryRevenue,
      serviceRevenue,
      otherRevenue,
      newBookings,
      checkedInGuests,
      upcomingArrivals,
      upcomingCheckouts
    },
    revenueByMonth,
    roomStatusCounts,
    totalRooms,
    reservedRoomsCount,
    sourceCounts,
    recentBookings,
    newBookingsList,
    currentStaysList,
    upcomingArrivalsList,
    upcomingCheckoutsList,
    recentTasks,
    totalReviews,
    avgRating,
    activities
  };
};

module.exports = {
  getDashboardStats
};
