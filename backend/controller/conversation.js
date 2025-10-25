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
      const { groupTitle, userId, sellerId } = req.body;

      if (!groupTitle || !userId || !sellerId) {
        return next(new ErrorHandler("Missing required fields", 400));
      }

      let conversation = await Conversation.findOne({ groupTitle });

      if (conversation) {
        // Conversation already exists
        return res.status(200).json({ success: true, conversation });
      }

      // Create new conversation
      conversation = await Conversation.create({
        members: [userId, sellerId],
        groupTitle,
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
