require("dotenv").config();

const mongoose = require("mongoose");

(async () => {
  try {
    console.log(process.version);
    console.log(process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();