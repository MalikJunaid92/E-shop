// This is a Vercel serverless function catch-all that re-uses the existing
// Express `app` exported from `backend/index.js`.
// It allows requests like `/api/v2/...` to be handled by your Express app.

const app = require("../backend/index");

// Export the Express app as the handler. Vercel's Node runtime will call
// this exported function for incoming requests. The Express app is a
// callable function (req, res) so we can just export it.
module.exports = (req, res) => app(req, res);
