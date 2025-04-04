import { isValidObjectId } from "mongoose";
import { Associate } from "../models/associate.model.js";
import { Payout } from "../models/payout.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { History } from "../models/history.model.js";
import { StaffPayout } from "../models/staffPayout.model.js";
import { Admin } from "../models/admin.model.js";

const getAllStaffPayout = asyncHandler(async (req, res) => {
    const payouts = await StaffPayout.aggregate([
        {
            $lookup: {
                from: 'admins',
                localField: 'staffId',
                foreignField: '_id',
                as: 'staffDetails'
            }
        },
        {
            $project: {
                name: { $arrayElemAt: ["$staffDetails.name", 0] },
                email: { $arrayElemAt: ["$staffDetails.email", 0] },
                incentive: { $arrayElemAt: ["$staffDetails.incentive", 0] },
                amount: 1,
                isPaid: 1,
                commission: 1,
                refCount: 1,
                createdAt: 1
            }
        }
    ]);

    if (!payouts || payouts.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, "No Payout Available"));
    }

    return res.status(200).json(new APIResponse(200, payouts, "Payout Details Fetched"));
});

const genrateStaffPayout = asyncHandler(async (req, res) => {
    // Fetch all associates who are eligible for payout (e.g., referrCount > 0)
    const staffs = await Admin.find({
        referralCount: { $gt: 0 },
        role: "user"
    });

    if (staffs.length === 0) {
        return res.status(404).json(new APIResponse(404, {}, "No Staff Found for Payout"));
    }

    const payouts = [];

    for (const staff of staffs) {
        const payoutAmount = staff.referralCount * staff.incentive; //  calculation

        // Create payout record
        const payout = await StaffPayout.create({
            staffId: staff._id,
            amount: payoutAmount,
            incentive: staff.incentive,
            refCount: staff.referralCount,
            isPaid: false,
        });

        // Reset referral count (if needed)
        await Admin.findByIdAndUpdate(staff._id, { referralCount: 0 });

        payouts.push(payout);
    }

    return res.status(201).json(new APIResponse(201, payouts, "Payouts Generated Successfully"));
});

const staffPay = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentMode, utr } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Payout ID'));
    }

    if (!paymentMode || !utr) {
        return res.status(400).json(new APIResponse(400, {}, 'Payment Mode and UTR are required'));
    }

    try {
        // Find payout
        const payout = await StaffPayout.findById(id);
        if (!payout) {
            return res.status(404).json(new APIResponse(404, {}, 'Payout not found'));
        }

        if (payout.isPaid) {
            return res.status(400).json(new APIResponse(400, {}, 'Payout already marked as paid'));
        }

        // Add payment details to history
        const paymentDetails = await History.create({
            reffererId: payout.staffId,
            userType: "Admin",
            amount: payout.amount,
            commission: payout.incentive,
            refCount: payout.refCount,
            paymentMode,
            utr
        });
        if (!paymentDetails) {
            return res.status(500).json(new APIResponse(500, {}, "Something went wrong while Payment Process"))
        }
        // Delete the payout after recording history
        await StaffPayout.findByIdAndDelete(id);

        res.status(200).json(new APIResponse(200, paymentDetails, 'Payout completed'));
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json(new APIResponse(200, {}, 'Internal server error'));
    }
})


export {
    getAllStaffPayout,
    genrateStaffPayout,
    staffPay,
}

