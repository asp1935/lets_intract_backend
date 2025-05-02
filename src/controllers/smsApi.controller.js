import { SmsApi } from "../models/smsApi.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const upsertSMSAPI = asyncHandler(async (req, res) => {
    try {
        const { apiUrl, apiKey, senderId, channel, dcs } = req.body;

        // Validate inputs
        const requiredFields = [apiUrl, apiKey, senderId, channel, dcs];
        if (requiredFields.some(field => !field || typeof field !== "string" || field.trim() === "")) {
            return res.status(400).json(new APIResponse(400, {}, "All fields are required and must be non-empty strings"));
        }

        const trimmedData = {
            apiUrl: apiUrl.trim(),
            apiKey: apiKey.trim(),
            senderId: senderId.trim(),
            channel: channel.trim(),
            dcs: dcs.trim()
        };

        // Update existing config or create one if not exists
        const config = await SmsApi.findOneAndUpdate(
            {}, // Empty filter — match the first doc
            { $set: trimmedData },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json(
            new APIResponse(200, config, "SMS API config saved successfully")
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const getSMSAPI = asyncHandler(async (req, res) => {
    try {
        const smsAPI = await SmsApi.find({});
        if (!smsAPI || smsAPI.length === 0) {
            return res.status(200).json(new APIResponse(200, {}, "SMS API not found"));
        }
        return res.status(200).json(new APIResponse(200, smsAPI, "SMS API fetched successfully"));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Interanl Server Error"))
    }
})

export {
    upsertSMSAPI,
    getSMSAPI,
}
