
const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Booking = require("./src/models/booking.model");
  const bookings = await Booking.find({}, "booking_code check_in_date created_at booking_status");
  bookings.forEach(b => {
    if(b.booking_code === "BKG-WALKIN-5ZNF3U" || b.booking_code === "BKG-WALKIN-WLVNJC") {
      console.log(b);
    }
  })
  mongoose.disconnect();
});

