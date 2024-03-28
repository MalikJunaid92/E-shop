const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./controller/user");
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use("/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true, limit:"50mb" }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}
// import routes

app.use("/api/v2/user", user);

// its for Error Handler
app.use(ErrorHandler);
module.exports = app;
