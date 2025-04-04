import mongoose from "mongoose";
import { Schema } from "mongoose";

const StaffPayoutSchema=new Schema({
    staffId:{
        type:Schema.Types.ObjectId,
        ref:'Admin',
        required:true
    },
    amount:{
        type:Number,
        required:true,
        default:0,
    },
    incentive:{
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

export const StaffPayout=mongoose.model('StaffPayout',StaffPayoutSchema);
