import mongoose, { Schema } from "mongoose";

const whatsappAPIConfigSchema=new Schema({
    apiKey:{
        type:String,
        required:true,
        trim:true,
    },
    apiAuthKey:{
        type:String,
        required:true,
        trim:true
    },
    channelNo:{
        type:String,
        required:true,
    },
    
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        unique:true,
    }
    
},{
    timestamps:true,
})

export const WhatsappAPIConfig=mongoose.model('WhatsappAPIConfig',whatsappAPIConfigSchema);