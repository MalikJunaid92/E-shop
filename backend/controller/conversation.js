const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Conversation = require("../model/conversation");
const ErrorHandler = require("../utils/ErrorHandler");
const express = require("express");

const router = express.Router();

// create a new conversation
router.post("create-new-conversation",catchAsyncErrors(async(req,res,next)=>{
    try {
        
    } catch (error) {
        return next(new ErrorHandler((error.response.data.message),400))
    }
}))