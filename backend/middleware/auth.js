const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");

exports.isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Please login to continue", 401));
  }
  const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
  req.user = await User.findById(decode.id);
  next();
});
