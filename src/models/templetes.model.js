import mongoose, { Schema } from "mongoose";

const templeteSchema = new Schema({

    templeteName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    templete: {
        type: String,
        required: true,
        trim: true
    },
}, {
    timestamps: true
})

export const Templete = mongoose.model('Templete', templeteSchema);