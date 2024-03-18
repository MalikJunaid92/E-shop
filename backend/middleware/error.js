const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Interval server error";
  // wrong mongodb id error
  if (err.name === "CastError") {
    const message = `Resource not found with this id.. Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate keys ${Object.keys(err.keyValue)}Entered`;
    err = new ErrorHandler(message, 400);
  }
  // wrong jwt
  if (err.name === "JsonwebtokenError") {
    const message = "You url is invalid please try again later.";
    err = new ErrorHandler(message, 400);
  }
  //jwt expired
  if (err.name === "TokenExpiredError") {
    const message = "You url is expired please try again later.";
    err = new ErrorHandler(message, 400);
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
