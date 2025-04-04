import mongoose, { Schema } from "mongoose";

const whatsappTempleteSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    templeteName: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    whatsappImg: {
        type: String, // Base64 string
        required: false,
    },


}, {
    timestamps: true
})

export const WhatsappTemplete = mongoose.model('WhatsappTemplete', whatsappTempleteSchema);