const User = require("../model/user");
const Shop = require("../model/shop");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

const isAuthenticated = async function (req, res, next) {
  try {
    // support token via cookie OR Authorization header (Bearer) as a fallback
    let token = req.cookies && req.cookies.token;
    if (!token && req.headers && req.headers.authorization) {
      const auth = req.headers.authorization.split(" ");
      if (auth[0] === "Bearer" && auth[1]) token = auth[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized. Login Required!" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const isSeller = async function (req, res, next) {
  try {
    // accept seller token from cookie or Authorization header (Bearer)
    let seller_token = req.cookies && req.cookies.seller_token;
    if (!seller_token && req.headers && req.headers.authorization) {
      const auth = req.headers.authorization.split(" ");
      if (auth[0] === "Bearer" && auth[1]) seller_token = auth[1];
    }

    if (!seller_token) {
      return res.status(401).json({ message: "Unauthorized. Login Required!" });
    }
    const decoded = jwt.verify(seller_token, JWT_SECRET);
    req.seller = await Shop.findById(decoded.id);
    if (!req.seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

function isAdmin(...roles) {
  return function (req, res, next) {
    try {
      if (!roles.includes(req.user && req.user.role)) {
        console.error(
          `${req.user && req.user.role} don't have access to these resources!`
        );
        return res
          .status(400)
          .json({ success: false, message: "Can't access this resources!" });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

module.exports = {
  isAuthenticated,
  isSeller,
  isAdmin,
};
