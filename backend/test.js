
const mongoose = require('mongoose');
require('dotenv').config();
const { getDashboardStats } = require('./src/modules/manager/dashboard/dashboard.service');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const stats = await getDashboardStats();
    console.log('SUCCESS');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await mongoose.disconnect();
  }
}
test();

