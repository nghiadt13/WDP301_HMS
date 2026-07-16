
const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Booking = require("./src/models/booking.model");
  const now = new Date();
  
  const futureRange = new Date(now);
  futureRange.setDate(now.getDate() + 7);
  
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  console.log("startOfToday:", startOfToday.toISOString());
  console.log("futureRange:", futureRange.toISOString());
  
  const upcomingArrivals = await Booking.countDocuments({
    booking_status: { $in: ["Pending", "Confirmed"] },
    check_in_date: { $gte: startOfToday, $lte: futureRange }
  });
  console.log("Upcoming arrivals:", upcomingArrivals);

  mongoose.disconnect();
});

