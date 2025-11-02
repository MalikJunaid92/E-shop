const express = require("express");
const Conversation = require("../model/conversation");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isSeller, isAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Create a new conversation
router.post(
  "/create-new-conversation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      let { groupTitle, userId, sellerId } = req.body;

      // log incoming body when fields are missing to help debug client issues
      if (!groupTitle || !userId || !sellerId) {
        console.error(
          "create-new-conversation missing fields, body:",
          req.body
        );

        // If sellerId is missing but groupTitle and userId are present,
        // try to infer sellerId from the groupTitle. The frontend builds
        // groupTitle as `${product._id}${user._id}` in ProductDetails, so
        // we can split two 24-char ObjectId strings and look up the product
        // to obtain its shop (seller) id.
        if (
          !sellerId &&
          groupTitle &&
          /^([a-f0-9]{24}){2}$/i.test(groupTitle)
        ) {
          const productId = groupTitle.slice(0, 24);
          try {
            const Product = require("../model/product");
            const product = await Product.findById(productId).select("shop");
            if (product && product.shop) {
              sellerId = product.shop.toString();
              req.body.sellerId = sellerId;
            }
          } catch (err) {
            console.error(
              "Error while inferring sellerId from productId:",
              err
            );
          }
        }

        // If groupTitle is missing but userId and sellerId exist, build a default
        // groupTitle to allow creating the conversation.
        if (!groupTitle && userId && sellerId) {
          groupTitle = `${userId}-${sellerId}`;
          req.body.groupTitle = groupTitle;
        }

        if (!groupTitle || !userId || !sellerId) {
          return next(new ErrorHandler("Missing required fields", 400));
        }
      }

      const finalGroupTitle = groupTitle || req.body.groupTitle;

      let conversation = await Conversation.findOne({
        groupTitle: finalGroupTitle,
      });

      if (conversation) {
        // Conversation already exists
        return res.status(200).json({ success: true, conversation });
      }

      // Create new conversation
      conversation = await Conversation.create({
        members: [userId, sellerId],
        groupTitle: finalGroupTitle,
      });

      res.status(201).json({ success: true, conversation });
    } catch (error) {
      console.error("Create conversation error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all conversations for a seller
router.get(
  "/get-all-conversation-seller/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: { $in: [req.params.id] },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);

// Get all conversations for a user
router.get(
  "/get-all-conversation-user/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const conversations = await Conversation.find({
        members: { $in: [req.params.id] },
      }).sort({ updatedAt: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);

// Update the last message
router.put(
  "/update-last-message/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { lastMessage, lastMessageId } = req.body;

      if (!lastMessage || !lastMessageId) {
        return next(new ErrorHandler("All fields are required", 400));
      }

      const conversation = await Conversation.findByIdAndUpdate(
        req.params.id,
        { lastMessage, lastMessageId },
        { new: true } // return updated document
      );

      res.status(200).json({
        success: true,
        conversation,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
