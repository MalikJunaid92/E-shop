const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const cors = require("cors");

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}
// import routes

app.use("/api/v2/user", user);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);


// its for Error Handler
app.use(ErrorHandler);
module.exports = app;
