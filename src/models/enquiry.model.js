import mongoose, { mongo, Schema } from "mongoose";

const EnquirySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    password:{
        type:String,
        required:true
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
    status:{
        type:String,
        default:"pending",
    }

});

export const Enquiry=mongoose.model("Enquiry",EnquirySchema);

