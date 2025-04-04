

import mongoose, { Schema } from "mongoose";

const smsAPIConfigSchema=new Schema({
    apiKey:{
        type:String,
        required:true,
        default:null,
        trim:true,
    },
    senderId:{
        type:String,
        default:null,
        required:true,
        trim:true
    },
    channelNo:{
        type:String,
        required:true,
    },
    dcs:{
        type:String,
        required:true,
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
    
},{
    timestamps:true,
})

export const SmsAPIConfig=mongoose.model('SmsAPIConfig',smsAPIConfigSchema);