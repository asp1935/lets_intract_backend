import mongoose, { Schema } from "mongoose";

const planSchema=new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    price:{
        type:Number,
        required:true,
        default:0
    },
    validity:{
        type:Number,
        required:true,
        default:0
    },
    smsAPIService:{
        type:Boolean,
        required:true,
        default:false,
    },
    whatsappAPIService:{
        type:Boolean,
        required:true,
        default:false,
    },

    smsCount:{
        type:Number,
        require:true,
        default:0
    },
    userSMSCount:{
        type:Number,
        required:true,
        default:0,
    },
    addMembers:{
        type:Boolean,
        required:true,
        default:false,
    },
    type:{
        type:String,
        required:true,
        default:'basic',
        enum:['basic','advance']
    }


},{
    timestamps:true,
})

export const Plan=mongoose.model('Plan',planSchema);