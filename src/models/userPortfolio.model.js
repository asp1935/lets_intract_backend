import mongoose, { Schema } from "mongoose";

const userPortfolioSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    }, // Unique user identifier
    userName: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    includeLink: {
        type: Boolean,
        required: true,
        default:false
    },
    name: {
        type: String,
        required: true
    },
    ownerName: {
        type: String,
        required: true
    },
    profilePhotoUrl: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    theme: {
        type: String
    },
    socialLinks: {
        whatsapp: { type: String },
        instagram: { type: String },
        facebook: { type: String },
    },
    services: [
        {
            title: { type: String, required: true },
            description: { type: String, required: true },
        },
    ],

    clients: [
        {
            name: { type: String, required: true },
            logoUrl: { type: String, required: true },
        },
    ],

    gallery: [
        {
            type: { type: String, enum: ["img", "video"], required: true }, // "img" or "video"
            url: { type: String, required: true },
            title: { type: String, required: true },
        },
    ],
});

export const UserPortfolio = mongoose.model('UserPortfolio', userPortfolioSchema);
