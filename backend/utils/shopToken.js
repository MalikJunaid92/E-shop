const sendShopToken = (user, statusCode, res) => {
  const jwt = require("jsonwebtoken");

  if (!user || !user._id) {
    console.error("❌ sendShopToken ERROR: Invalid user object ->", user);
    return res.status(500).json({
      success: false,
      message: "User data invalid while generating token",
    });
  }

  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
  if (!secret) throw new Error("JWT secret is not defined.");

  const token = jwt.sign({ id: user._id }, secret, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    path: "/",
  };

  console.log("✅ sendShopToken created token:", token.slice(0, 20) + "...");

  return res
    .status(statusCode)
    .cookie("seller_token", token, cookieOptions)
    .json({
      success: true,
      user,
      token,
    });
};

module.exports = sendShopToken;
