import mongoose, { Schema } from "mongoose";

const smsTempleteSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    templeteName: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true
    },


}, {
    timestamps: true
})

export const SmsTemplete=mongoose.model('SmsTemplete',smsTempleteSchema);