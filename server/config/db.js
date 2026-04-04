const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\n  ☕ MongoDB Connected: ${conn.connection.host}`);
    console.log(`  📦 Database: ${conn.connection.name}\n`);
  } catch (error) {
    console.error(`\n  ❌ MongoDB Connection Error: ${error.message}\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
