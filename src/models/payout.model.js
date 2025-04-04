import mongoose from "mongoose";
import { Schema } from "mongoose";

const PayoutSchema=new Schema({
    associateId:{
        type:Schema.Types.ObjectId,
        ref:'Associate',
        required:true
    },
    amount:{
        type:Number,
        required:true,
        default:0,
    },
    commission:{
        type:Number,
        required:true,
        default:0,
    },
    refCount:{
        type:Number,
        required:true,
        default:0,
    },
    isPaid:{
        type:Boolean,
        default:false,
    },
},{timestamps:true});

export const Payout=mongoose.model('Payout',PayoutSchema);
