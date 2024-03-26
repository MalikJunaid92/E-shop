const express = require("express");
const router = express.Router();
const { upload } = require("../multer");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");

router.post("/create-user", upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      // User already exists, delete the uploaded file
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`;

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ message: "Error deleting file", error: err });
          return;
        }
        res.json({ message: "File has been deleted." });
      });

      return next(new ErrorHandler("User already exists", 400));
    }

    const { filename, path: filePath } = req.file;
    const user = {
      name: name,
      email: email,
      password: password,
      avatar: {
        url: filename,
        public_id: filePath,
      },
    };
    const activationToken = createActivationToken(user);
    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
// create activationToken
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.Activation_SECRET, {
    expiresIn: "5m",
  });
};
module.exports = router;
