

import mongoose, { Schema } from "mongoose";

const smsApi = new Schema({
    apiUrl: {
        type: String,
        required: true,
        default: null,
        trim: true,
    },
    apiKey: {
        type: String,
        required: true,
        default: null,
        trim: true,
    },
    senderId: {
        type: String,
        default: null,
        required: true,
        trim: true
    },
    channel: {
        type: String,
        required: true,
    },
    dcs: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
})

export const SmsApi = mongoose.model('SmsApi', smsApi);