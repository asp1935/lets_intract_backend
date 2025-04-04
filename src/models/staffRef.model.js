import mongoose, { Schema } from "mongoose";

const StaffRefSchema = new Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

}, {
    timestamps: true
});

// Increment tempReferralCount in Admin(staff) after saving a referral
StaffRefSchema.post('save', async function () {
    await mongoose.model('Admin').findByIdAndUpdate(this.staffId, {
        $inc: { referralCount: 1 }
    });
});

export const StaffRef = mongoose.model("StaffRef", StaffRefSchema);


