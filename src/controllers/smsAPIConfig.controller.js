import { isValidObjectId } from "mongoose";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { SmsAPIConfig } from "../models/smsAPIConfig.model.js";
import { User } from "../models/user.model.js";

//create or update whatsapp Config
const upsertSMSAPIConfig = asyncHandler(async (req, res) => {
    const { apiKey, senderId, channelNo,dcs, userId } = req.body;

    if (!apiKey || !senderId || !channelNo || !dcs || !userId) {
        return res.status(400).json(new APIResponse(400, {}, 'All fields are required'));
    }
    if(!isValidObjectId(userId)){
        return res.status(400).json(new APIResponse(400,{},'Invalid User ID'))
    }
    const user=await User.findById(userId);
    if(!user){
        return res.status(404).json(new APIResponse(404,{},"User Not Found"))
    }

    const updatedConfig = await SmsAPIConfig.findOneAndUpdate(
        { userId }, // Find by userId
        { apiKey, senderId, channelNo,dcs }, // Update fields
        { new: true, upsert: true, runValidators: true } // Upsert: Create if not exists
    );

    return res.status(200).json(new APIResponse(200, updatedConfig, updatedConfig._id ? 'API Config updated successfully' : 'API Config created successfully'));
});

const deleteSmsAPIConfig = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json(new APIResponse(400, {}, 'User ID is Required'))
    }
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }
    const deletedConfig = await SmsAPIConfig.findOneAndDelete(userId);
    if (!deletedConfig) {
        return res.status(404).json(new APIResponse(404, {}, 'API Config not found'));
    }
    return res.status(200).json(new APIResponse(200, {}, 'API Config deleted successfully'));
});

// All API Configs

const getAllSmsConfigs = asyncHandler(async (req, res) => {
    const configs = await SmsAPIConfig.find().populate({
        path: "userId",
        select: "-password -__v"
    }).select('-__v');
    return res.status(200).json(new APIResponse(200, configs, 'All API Configs retrieved'));
});

//get api config by userId
const getSmsAPIConfigByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'))
    }
    const config = await SmsAPIConfig.findOne({ userId }).populate({
        path: "userId",
        select: "-password -__v"
    }).select('-__v')

    if (!config) {
        return res.status(404).json(new APIResponse(404, {}, 'API Config not found for this user'));
    }

    return res.status(200).json(new APIResponse(200, config, 'API Config retrieved'));
});


//get api config from mobile 
const getSmsAPIConfigMobile = asyncHandler(async (req, res) => {
    const userId = req.user?.role === 'user' ? req.user._id : req.user?.role === 'member' ? req.user.userId : null;

    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'))
    }
    const config = await SmsAPIConfig.findOne({ userId })

    if (!config) {
        return res.status(404).json(new APIResponse(404, {}, 'API Config not found for this user'));
    }

    return res.status(200).json(new APIResponse(200, config, 'API Config retrieved'));
});



export {
    upsertSMSAPIConfig,
    deleteSmsAPIConfig,
    getAllSmsConfigs,
    getSmsAPIConfigByUserId,
    getSmsAPIConfigMobile


}