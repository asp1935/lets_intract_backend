import { Schema, model } from "mongoose";

const PlanPurchaseHistorySchema = new Schema({
    planId: {
        type: Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,  // Automatically sets the date at the time of creation
    }
});

// Export the model
export const PlanPurchaseHistory = model('PlanPurchaseHistory', PlanPurchaseHistorySchema);
