import mongoose, { Schema } from "mongoose";

const userPlanSchema = new Schema({

    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,
        index: { expires: 0 }
    },
    usedMsgCount: {
        type: Number,
        default: 0,
        required: true,
    },

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    planId: {
        type: Schema.Types.ObjectId,
        ref: 'Plan'
    },
}, {
    timestamps: true,
});

//calculate and save endDate 
userPlanSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('planId')) {
        const plan = await mongoose.model('Plan').findById(this.planId);
        if (plan) {
            this.endDate = new Date(this.startDate.getTime() + plan.validity * 24 * 60 * 60 * 1000);
        }
    }
    next();
});

// // Update endDate if startDate is updated
// userPlanSchema.pre("findOneAndUpdate", async function (next) {
//     const update = this.getUpdate();

//     if (update.startDate) {
//         const existingUserPlan = await this.model.findOne(this.getQuery());
//         if (!existingUserPlan) return next(new Error("User plan not found"));

//         const plan = await mongoose.model("Plan").findById(existingUserPlan.planId);
//         if (plan) {
//             update.endDate = new Date(new Date(update.startDate).getTime() + plan.validity * 24 * 60 * 60 * 1000);
//         }
//     }
//     next();
// });

export const UserPlan = mongoose.model('UserPlan', userPlanSchema);