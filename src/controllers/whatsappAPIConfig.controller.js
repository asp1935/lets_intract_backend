import { isValidObjectId } from "mongoose";
import { WhatsappAPIConfig } from "../models/whatsappAPIConfig.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

//create or update whatsapp Config
const upsertWhatsappAPIConfig = asyncHandler(async (req, res) => {
    const { apiKey, apiAuthKey, channelNo, userId } = req.body;

    if (!apiKey || !apiAuthKey || !channelNo || !userId) {
        return res.status(400).json(new APIResponse(400, {}, 'All fields are required'));
    }

    const updatedConfig = await WhatsappAPIConfig.findOneAndUpdate(
        { userId }, // Find by userId
        { apiKey, apiAuthKey, channelNo }, // Update fields
        { new: true, upsert: true, runValidators: true } // Upsert: Create if not exists
    );

    return res.status(200).json(new APIResponse(200, updatedConfig, updatedConfig._id ? 'API Config updated successfully' : 'API Config created successfully'));
});

const deleteWhatsappAPIConfig = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json(new APIResponse(400, {}, 'User ID is Required'))
    }
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }
    const deletedConfig = await WhatsappAPIConfig.findOneAndDelete(userId);
    if (!deletedConfig) {
        return res.status(404).json(new APIResponse(404, {}, 'API Config not found'));
    }
    return res.status(200).json(new APIResponse(200, {}, 'API Config deleted successfully'));
});

// All API Configs

const getAllWhatsappAPIConfigs = asyncHandler(async (req, res) => {
    const configs = await WhatsappAPIConfig.find().populate({
        path: "userId",
        select: "-password -__v"
    }).select('-__v');
    return res.status(200).json(new APIResponse(200, configs, 'All API Configs retrieved'));
});

//get api config by userId
const getWhatsappAPIConfigByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'))
    }
    const config = await WhatsappAPIConfig.findOne({ userId }).populate({
        path: "userId",
        select: "-password -__v"
    }).select('-__v')

    if (!config) {
        return res.status(404).json(new APIResponse(404, {}, 'API Config not found for this user'));
    }

    return res.status(200).json(new APIResponse(200, config, 'API Config retrieved'));
});


//get api config from mobile 
const getWhatsappAPIConfigMobile = asyncHandler(async (req, res) => {
    const userId = req.user?.role === 'user' ? req.user._id : req.user?.role === 'member' ? req.user.userId : null;
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'))
    }
    // const config = await WhatsappAPIConfig.findOne({ userId }).populate({
    //     path: "userId",
    //     select: "-password -__v"
    // }).select('-__v')
    const config = await WhatsappAPIConfig.findOne({ userId })
    
    if (!config) {
        return res.status(404).json(new APIResponse(404, {}, 'API Config not found for this user'));
    }

    return res.status(200).json(new APIResponse(200, config, 'API Config retrieved'));
});



export {
    upsertWhatsappAPIConfig,
    deleteWhatsappAPIConfig,
    getAllWhatsappAPIConfigs,
    getWhatsappAPIConfigByUserId,
    getWhatsappAPIConfigMobile


}