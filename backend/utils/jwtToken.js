const jwt = require("jsonwebtoken");

// pick a JWT secret consistently. some parts of the codebase historically
// used JWT_SECRET_KEY; prefer JWT_SECRET but fall back when necessary.
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;

console.log("DEBUG JWT_SECRET:", typeof JWT_SECRET !== "undefined");
console.log(
  "DEBUG ACTIVATION_SECRET:",
  typeof process.env.ACTIVATION_SECRET !== "undefined"
);

if (!JWT_SECRET) {
  throw new Error(
    "JWT secret is not defined. Ensure dotenv is loaded and JWT_SECRET or JWT_SECRET_KEY is present."
  );
}

const sendToken = (user, statusCode, res) => {
  // sign a JWT for auth (adjust payload as you need)
  const token = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
  });

  // cookie options
  const isProd = process.env.NODE_ENV === "production";
  // When sending cookies cross-site (frontend on HTTPS, backend on another origin)
  // browsers require SameSite=None and Secure=true. We set Secure when in
  // production. For local development using HTTP, cookies with SameSite=None may
  // be rejected by the browser if the request comes from an HTTPS origin.
  res.cookie("token", token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
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
