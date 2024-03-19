const express = require("express");
const ErrorHandler = require("./utils/ErrorHandler");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./controller/user");

app.use(express.json());
app.use(cookieParser());
app.use("/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}
// import routes

app.use("/api/v2", user);

// its for Error Handler
app.use(ErrorHandler);
module.exports = app;
