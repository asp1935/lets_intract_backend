import mongoose, { Schema } from "mongoose";

const AssociateSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
        index: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[0-9]{10}$/, // Ensures exactly 10 digits
        index: true,
    },
    state: {
        type: String,
        trim: true,
        default: null
    },
    district: {
        type: String,
        trim: true,
        default: null

    },
    taluka: {
        type: String,
        trim: true,
        default: null

    },
    commission: {
        type: Number,
        default: 0
    },
    referralCount: {
        type: Number,
        default: 0,
    },

}, {
    timestamps: true
});

export const Associate = mongoose.model("Associate", AssociateSchema);


