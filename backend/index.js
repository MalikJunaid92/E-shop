const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

// expose a lightweight health endpoint for quick production checks
// GET /api/v2/health -> { success, dbConnected, dbState, env }

// During debugging we want to restrict the backend to accept requests only
// from the local frontend (http://localhost:3000). To avoid accidentally
// allowing the deployed frontend while we're diagnosing auth/CORS issues,
// we force the default allowed origin to localhost. You can still override
// this using ALLOWED_ORIGINS env var if needed.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:3000"];

console.log("CORS allowed origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);

      // Exact match against configured allowed origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        // console.debug for allowed origin
        console.log("CORS: allowing origin (exact match):", origin);
        return callback(null, true);
      }

      // Optional: allow any Vercel frontend subdomain when ALLOW_VERCEL env var is set
      // This helps during debugging when your frontend is deployed on Vercel and
      // you want to call a local backend without listing every deployment URL.
      if (
        process.env.ALLOW_VERCEL === "true" &&
        origin.endsWith(".vercel.app")
      ) {
        console.log("CORS: allowing origin (vercel wildcard):", origin);
        return callback(null, true);
      }

      console.error("Blocked CORS request from origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("✅ Backend running successfully on Vercel!");
});

// Health endpoint for quick checks (DB + env presence)
app.get("/api/v2/health", (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState; // 0 = disconnected, 1 = connected
    return res.status(200).json({
      success: true,
      dbConnected: dbState === 1,
      dbState,
      env: {
        hasDB_URL: !!process.env.DB_URL,
        hasCLOUDINARY: !!process.env.CLOUDINARY_NAME,
        hasACTIVATION_SECRET: !!process.env.ACTIVATION_SECRET,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// import routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");
const withdraw = require("./controller/withdraw");

app.use("/api/v2/user", user);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);

// it's for ErrorHandling
app.use(ErrorHandler);

module.exports = app;
