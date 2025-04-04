import { isValidObjectId } from "mongoose";
import { Associate } from "../models/associate.model.js";
import { Payout } from "../models/payout.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { History } from "../models/history.model.js";

const getAllPayout = asyncHandler(async (req, res) => {
    const payouts = await Payout.aggregate([
        {
            $lookup: {
                from: 'associates',
                localField: 'associateId',
                foreignField: '_id',
                as: 'associateDetails'
            }
        },
        {
            $project: {
                name: { $arrayElemAt: ["$associateDetails.name", 0] },
                mobile: { $arrayElemAt: ["$associateDetails.mobile", 0] },
                email: {$arrayElemAt:["$associateDetails.email",0]},
                commission: {$arrayElemAt:["$associateDetails.commission",0]},
                amount: 1,
                isPaid: 1,
                commission:1,
                refCount:1,
                createdAt: 1
            }
        }
    ]);

    if (!payouts || payouts.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, "No Payout Available"));
    }

    return res.status(200).json(new APIResponse(200, payouts, "Payout Details Fetched"));
});

const genratePayout = asyncHandler(async (req, res) => {
    // Fetch all associates who are eligible for payout (e.g., referrCount > 0)
    const associates = await Associate.find({ referralCount: { $gt: 0 } });

    if (associates.length === 0) {
        return res.status(404).json(new APIResponse(404, {}, "No Associates Found for Payout"));
    }

    const payouts = [];

    for (const associate of associates) {
        const payoutAmount = associate.referralCount * associate.commission; //  calculation

        // Create payout record
        const payout = await Payout.create({
            associateId: associate._id,
            amount: payoutAmount,
            commission:associate.commission,
            refCount: associate.referralCount,
            isPaid:false,
        });

        // Reset referral count (if needed)
        await Associate.findByIdAndUpdate(associate._id, { referralCount: 0 });

        payouts.push(payout);
    }

    return res.status(201).json(new APIResponse(201, payouts, "Payouts Generated Successfully"));
});

const pay=asyncHandler(async(req,res)=>{
    const { id } = req.params;
    const { paymentMode, utr } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400,{},'Invalid Payout ID' ));
    }

    if (!paymentMode || !utr) {
        return res.status(400).json(new APIResponse(400,{},'Payment Mode and UTR are required' ));
    }

    try {
        // Find payout
        const payout = await Payout.findById(id);
        if (!payout) {
            return res.status(404).json(new APIResponse(404,{},'Payout not found' ));
        }

        if (payout.isPaid) {
            return res.status(400).json(new APIResponse(400,{},'Payout already marked as paid' ));
        }

        // Add payment details to history
        const paymentDetails= await History.create({
            reffererId: payout.associateId,
            userType:"Associate",
            amount: payout.amount,
            commission:payout.commission,
            refCount:payout.refCount,
            paymentMode,
            utr
        });
        if(!paymentDetails ){
            return res.status(500).json(new APIResponse(500,{},"Something went wrong while Payment Process"))
        }
        // Delete the payout after recording history
        await Payout.findByIdAndDelete(id);

        res.status(200).json(new APIResponse(200,paymentDetails,'Payout completed' ));
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json(new APIResponse(200,{},'Internal server error' ));
    }
})


export {
    getAllPayout,
    genratePayout,
    pay,
}

