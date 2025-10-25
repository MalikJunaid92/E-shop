const jwt = require("jsonwebtoken");

// debug / fail-fast: confirm env values when this module is loaded
console.log("DEBUG JWT_SECRET:", typeof process.env.JWT_SECRET !== "undefined");
console.log(
  "DEBUG ACTIVATION_SECRET:",
  typeof process.env.ACTIVATION_SECRET !== "undefined"
);
if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined. Ensure dotenv is loaded before requiring this module."
  );
}

const sendToken = (user, statusCode, res) => {
  // sign a JWT for auth (adjust payload as you need)
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

  // cookie options
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  // respond with token and user (omit sensitive fields in user object)
  // If user is a mongoose doc, convert toObject and remove password
  let safeUser = user;
  try {
    safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;
  } catch (err) {
    // ignore, fallback to user as-is
  }

  return res.status(statusCode).json({
    success: true,
    user: safeUser,
    token,
  });
};

module.exports = {
  sendToken,
};
