import { PlanPurchaseHistory } from "../models/planPurchaseHistory.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Get All Purchase History with User and Plan Details
const getAllPurchaseHistory = asyncHandler(async (req, res) => {
    const history = await PlanPurchaseHistory.find()
        .populate('planId', 'name validity price')  // Populate plan details
        .populate('userId', 'name mobile type')    // Populate user details
        .sort({ purchaseDate: -1 });

    if (!history.length) {
        return res.status(404).json(new APIResponse(404, {}, 'No Purchase History Found'));
    }

    return res.status(200).json(new APIResponse(200, history, 'All Purchase Histories Fetched Successfully'));
});

const getReport = asyncHandler(async (req, res) => {
    const { month, year } = req.query;
    if (!month || !year) {
        return res.status(400).json(new APIResponse(400, {}, 'Month & Year are Required'))
    }
    const startDate = new Date(`${year}-${month}-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-${month}-31T23:59:59.999Z`);


    const report = await PlanPurchaseHistory.aggregate([
        {
            $match: {
                purchaseDate: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        {
            $lookup: {
                from: "plans",
                localField: "planId",
                foreignField: "_id",
                as: "plan"
            }
        },
        { $unwind: "$plan" },
        // Get referral details
        {
            $lookup: {
                from: "referrals",
                localField: "userId",
                foreignField: "userId",
                as: "associateDetails"
            }
        },
        { $unwind: { path: "$associateDetails", preserveNullAndEmptyArrays: true } },

        // Get staff details
        {
            $lookup: {
                from: "staffrefs",
                localField: "userId",
                foreignField: "userId",
                as: "staffDetails"
            }
        },
        { $unwind: { path: "$staffDetails", preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: "associates",
                localField: "associateDetails.associateId",
                foreignField: "_id",
                as: "associateRef"
            }
        },
        { $unwind: { path: "$associateRef", preserveNullAndEmptyArrays: true } },

        // Get staff details from admin table
        {
            $lookup: {
                from: "admins",
                localField: "staffDetails.staffId",
                foreignField: "_id",
                as: "staffRef"
            }
        },
        { $unwind: { path: "$staffRef", preserveNullAndEmptyArrays: true } },

        {
            $project: {
                _id: 0,
                purchaseDate: 1,
                name: "$user.name",
                email: "$user.email",
                mobile: "$user.mobile",
                type: "$user.type",
                planType: "$plan.type",
                planName: "$plan.name",
                planPrice: "$plan.price",
                referredBy: { $ifNull: ["$associateRef.name", "$staffRef.name"] },
                commission: { $ifNull: ["$associateRef.commission", "$staffRef.incentive"] },
            }
        }
    ]);

    if (!report || report.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, 'No Report History  Available'));

    }
    return res.status(200).json(new APIResponse(200, report, 'Report Data Fetched'));


});


export {
    getAllPurchaseHistory,
    getReport
}
