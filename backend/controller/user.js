const express = require("express");
const router = express.Router();
const { upload } = require("../multer");
const User = require("../model/user");
const ErrorHandler = require("../utils/ErrorHandler");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated } = require("../middleware/auth");

router.post("/create-user", upload.single("avatar"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return next(new ErrorHandler("User already exists", 400));
    }

    const avatar = req.file
      ? { url: req.file.filename, public_id: req.file.path }
      : undefined;
    const user = new User({
      name,
      email,
      password,
      avatar,
    });

    await user.save();

    const activationToken = createActivationToken(user);
    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    await sendMail({
      email: user.email,
      subject: "Activate your account",
      message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email: ${user.email} to activate your account!`,
    });
  } catch (error) {
    next(error);
  }
});

// create activationToken
const createActivationToken = (user) => {
  const userObject = user.toObject();
  return jwt.sign(userObject, process.env.ACTIVATION_SECRET, {
    expiresIn: "1d",
  });
};

// activate user
// user.js

router.get(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.query; // Retrieve activation token from query parameter

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }

      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }

      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// log out user
router.get(
  "/logout",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out SuccessFull!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }
      user.name = name;
      user.email = email;
      user.phoneNumber = user.phoneNumber;
      await user.save();
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  upload.single("image"),
  async (req, res, next) =>
    catchAsyncErrors(async (req, res, next) => {
      try {
        const existUser = await User.findById(req.user.id);
        const existAvatarpath = `uploads/${existUser.avatar}`;
        fs.unlinkSync(existAvatarpath);
        const fileUrl = path.join(req.file.filename);
        const user = await User.findByIdAndUpdate(req.user.id, {
          avatar: fileUrl,
        });
        res.status(200).json({
          success: true,
          user,
        });
      } catch (error) {
        return next(new ErrorHandler(error.message, 500));
      }
    })
);
// update user address
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// update user password
router.put("/update-user-password",isAuthenticated,catchAsyncErrors(async(req,res,next)=>{
  try {
    const user=await User.findById(req.user.id).select("+password")
    const ispasswordMatched= await user.comparePassword(req.body.oldPassword)
    if(!ispasswordMatched){
      return next(new ErrorHandler("Old Password is incorrected!",400))
    }
    if(req.body.newPassword !== req.body.confirmPassword){
      return next(new ErrorHandler(" Password doesn't match with each other!",400))
    }
    user.password=req.body.newPassword
    await user.save();
    res.status(200).json({ success: true, message: "Password updated successfully!" });

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
    
  }
}))
module.exports = router;
