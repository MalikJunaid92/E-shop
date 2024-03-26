const express = require("express");
const router = express.Router();
const { upload } = require("../multer");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const jwt  = require("jsonwebtoken");

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
    const newUser = await User.create(user);
    res.status(201).json({
      success: true,
      newUser,
    });
  } catch (error) {
    console.error(error);
    next(error); // Pass the error to the error handling middleware
  }
});
// create activationToken
const createActivationToken=(user) =>{
  return jwt.sign(user,process.env.Activation_SECRET,{
    expiresIn:'5m',
  })
}
module.exports = router;
