const mongoose = require("mongoose");

let connectionPromise = null;

const connectDatabase = () => {
  // If already connected or connecting, return the existing promise so
  // serverless functions can await the same connection attempt.
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected (readyState=1)");
    return Promise.resolve(mongoose.connection);
  }

  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`mongod connected with server: ${data.connection.host}`);
      return data.connection;
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      // reset connectionPromise so future attempts may retry
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
};

module.exports = connectDatabase;
