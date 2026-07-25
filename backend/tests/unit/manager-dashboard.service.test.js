const { getDashboardStats } = require('../../src/modules/manager/dashboard/dashboard.service');
const Booking = require('../../src/models/booking.model');
const Invoice = require('../../src/models/invoice.model');
const Room = require('../../src/models/room.model');
const StaffTask = require('../../src/models/staffTask.model');
const CustomerFeedback = require('../../src/models/customerFeedback.model');
const BookingCharge = require('../../src/models/booking-charge.model');

jest.mock('../../src/models/booking.model');
jest.mock('../../src/models/invoice.model');
jest.mock('../../src/models/room.model');
jest.mock('../../src/models/staffTask.model');
jest.mock('../../src/models/customerFeedback.model');
jest.mock('../../src/models/booking-charge.model');

describe('Manager Dashboard Service Unit Tests (UT075 - UT078)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Invoice.aggregate.mockImplementation((pipeline) => {
      const groupStage = pipeline.find(stage => stage.$group);
      if (groupStage && groupStage.$group._id && groupStage.$group._id.month) {
        return Promise.resolve([{ _id: { month: 7, year: 2026 }, total: 10000000 }]);
      }
      return Promise.resolve([{ total: 10000000, roomRevenue: 8000000, extraRevenue: 2000000 }]);
    });

    Invoice.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
    BookingCharge.aggregate.mockResolvedValue([]);
    Booking.countDocuments.mockResolvedValue(5);
    Booking.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        }),
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      })
    });

    Room.aggregate.mockResolvedValue([{ _id: 'Available', count: 10 }]);
    Room.countDocuments.mockResolvedValue(10);
    StaffTask.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      })
    });
    CustomerFeedback.aggregate.mockResolvedValue([{ totalCount: 10, avgRating: 4.8 }]);
  });

  it('UT075: Lấy thống kê tổng quan Manager Dashboard (kpis)', async () => {
    const stats = await getDashboardStats('week');

    expect(stats).toHaveProperty('kpis');
    expect(stats.kpis.totalRevenue).toBe(10000000);
    expect(stats.kpis.roomRevenue).toBe(8000000);
  });

  it('UT076: Lấy biểu đồ doanh thu theo tháng (revenueByMonth)', async () => {
    const stats = await getDashboardStats('month');

    expect(stats).toHaveProperty('revenueByMonth');
    expect(Array.isArray(stats.revenueByMonth)).toBe(true);
  });

  it('UT077: Lấy tỷ lệ và số lượng phòng theo trạng thái (roomStatusCounts)', async () => {
    const stats = await getDashboardStats('day');

    expect(stats).toHaveProperty('totalRooms', 10);
    expect(stats.roomStatusCounts).toHaveLength(1);
    expect(stats.roomStatusCounts[0]._id).toBe('Available');
  });

  it('UT078: Lấy đánh giá trung bình và tổng số đánh giá của khách hàng (avgRating, totalReviews)', async () => {
    const stats = await getDashboardStats('week');

    expect(stats.totalReviews).toBe(10);
    expect(stats.avgRating).toBe(4.8);
  });
});
