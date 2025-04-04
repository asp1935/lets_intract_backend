import mongoose, { Schema } from "mongoose";

const UserMessageSchema = new Schema({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    whatsappImg: {
        type: String, // Base64 string
        required: false,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
    }
});

export const UserMessage = mongoose.model('UserMessage', UserMessageSchema);