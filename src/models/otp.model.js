import mongoose, { Schema } from "mongoose";

const OtpSchema = new Schema({
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: /^[0-9]{10}$/, // Ensures exactly 10 digits
        index: true,
    },
    otp: {
        type: String,
        required: true
    },
    
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
        index: { expires: '10m' }
    }
}, {
    timestamps: true
});

export const Otp = mongoose.model('Otp', OtpSchema);
