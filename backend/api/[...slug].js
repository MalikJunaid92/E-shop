// This is a Vercel serverless function catch-all that re-uses the existing
// Express `app` exported from `backend/index.js`.
// It allows requests like `/api/v2/...` to be handled by your Express app.

const app = require("../index");
const connectDatabase = require("../db/Database");

// Kick off a DB connection promise (if DB_URL is configured). The promise
// will be reused across warm function instances. The handler awaits the
// connection before delegating to the Express app so route handlers can
// safely use Mongoose.
let dbPromise = null;
if (process.env.DB_URL) {
  dbPromise = connectDatabase();
} else {
  console.warn(
    "DB_URL not set; database connection skipped in serverless function."
  );
}

module.exports = async (req, res) => {
  try {
    if (dbPromise) await dbPromise;
  } catch (err) {
    console.error("DB connection failed before handling request:", err);
    return res
      .status(500)
      .json({ success: false, message: "Database connection error" });
  }

  return app(req, res);
};
