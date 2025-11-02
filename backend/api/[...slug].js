// This is a Vercel serverless function catch-all that re-uses the existing
// Express `app` exported from `backend/index.js`.
// It allows requests like `/api/v2/...` to be handled by your Express app.

const app = require("../index");
const connectDatabase = require("../db/Database");

// Try to connect to the database when the function instance initializes.
// For serverless warm instances this will reuse the open connection.
if (process.env.DB_URL) {
  try {
    connectDatabase();
  } catch (err) {
    console.error("DB connect error:", err);
  }
} else {
  console.warn(
    "DB_URL not set; database connection skipped in serverless function."
  );
}

module.exports = (req, res) => app(req, res);
