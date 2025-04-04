// import mongoose, { Schema } from "mongoose";

// const HistorySchema = new Schema({
//     associateId: {
//         type: Schema.Types.ObjectId,
//         ref: 'Associate',
//         required: true
//     },
//     refCount:{
//         type:Number,
//         required:true,
//         default:0,
//     },
//     commission:{
//         type:Number,
//         required:true,
//         default:0,
//     },
//     amount: {
//         type: Number,
//         required: true
//     },
//     paymentMode: {
//         type: String,
//         required: true
//     },
//     utr: {
//         type: String,
//         required: true
//     },
// }, { timestamps: true });

// export const History = mongoose.model('History', HistorySchema);



import mongoose, { Schema } from "mongoose";

const HistorySchema = new Schema({
    reffererId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'userType'
    },
    userType: {
        type: String,
        required: true,
        enum: ['Associate', 'Admin']
    },
    refCount: {
        type: Number,
        required: true,
        default: 0,
    },
    commission: {
        type: Number,
        required: true,
        default: 0,
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMode: {
        type: String,
        required: true
    },
    utr: {
        type: String,
        required: true
    },
}, { timestamps: true });

export const History = mongoose.model('History', HistorySchema);
