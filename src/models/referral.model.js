import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
    associateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Associate',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });

// Increment tempReferralCount in Associate after saving a referral
referralSchema.post('save', async function () {
    await mongoose.model('Associate').findByIdAndUpdate(this.associateId, {
        $inc: { referralCount: 1 }
    });
});

export const Referral = mongoose.model('Referral', referralSchema);
