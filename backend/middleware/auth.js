const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
const ErrorHandler = require("../utils/ErrorHandler");

exports.isAuthenticated = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorHandler(err.message || "Authentication failed", 401));
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    console.log("DEBUG auth cookies:", req.cookies);
    console.log("DEBUG auth header:", req.headers.authorization);

    let token = null;

    // 1️⃣ Prefer cookie token first
    if (req.cookies && req.cookies.seller_token) {
      token = req.cookies.seller_token;
    }
    // 2️⃣ Fallback to Authorization header if no cookie
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      console.error("No token found in cookies or headers");
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!secret) throw new Error("JWT secret not defined in .env");

    const decoded = jwt.verify(token, secret);
    console.log("DEBUG decoded token:", decoded);

    const shop = await Shop.findById(decoded.id);
    if (!shop) {
      console.error("No shop found for ID:", decoded.id);
      return next(new ErrorHandler("Seller not found", 404));
    }

    req.user = shop;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return next(new ErrorHandler(err.message || "Authentication failed", 401));
  }
};

exports.isAdmin = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`${req.user.role} can not access this resources!`)
      );
    }
    next();
  };
};
