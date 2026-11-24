const mongoose = require('mongoose');
const colors = require('colors'); // missing import

// function to connect to the database
const connectDb = async () => {
  try {
    console.log("MONGO_URL =", process.env.MONGO_URL);
    
    await mongoose.connect(process.env.MONGO_URL);

    console.log(
      `Connected to database successfully`.white.bgGreen,
      mongoose.connection.host
    );

  } catch (error) {
    console.log(
      `Error connecting to database`.bgRed.white,
      error
    );
    // Keep server running so non-DB routes (health/test) still work.
    // DB-dependent routes should handle unavailable DB gracefully.
  }
};

module.exports = connectDb;