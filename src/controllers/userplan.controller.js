import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import { UserPlan } from "../models/userplan.model.js";
import { Plan } from "../models/plan.model.js";
import { PlanPurchaseHistory } from "../models/planPurchaseHistory.model.js";

const updateUserPlan = asyncHandler(async (req, res) => {
    const { userId, planId, startDate, usedMsgCount = 0 } = req.body;

    // Validate userId and planId
    if (!isValidObjectId(userId) || !isValidObjectId(planId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid UserID/PlanID Provided'));
    }

    // Check if User exists
    const user = await User.findById(userId).select('-password');
    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, 'User Not Found'));
    }

    // Check if Plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
        return res.status(404).json(new APIResponse(404, {}, 'Plan Not Found'));
    }

    // Calculate `endDate`
    const startDateObj = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(startDateObj.getTime() + plan.validity * 24 * 60 * 60 * 1000);

    // Update or Insert User Plan
    const userplan = await UserPlan.findOneAndUpdate(
        { userId },
        {
            userId,
            planId,
            startDate: startDateObj,
            endDate,
            usedMsgCount,
        },
        {
            new: true,   // Return the updated/new document
            upsert: true, // Create a new document if not found
            runValidators: true // Ensure validation rules are applied
        }
    );

    if (!userplan) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while Updating Plan'));
    }

    //  Add to Purchase History
    await PlanPurchaseHistory.create({
        userId,
        planId,
        purchaseDate: new Date()
    });

    return res.status(200).json(new APIResponse(200, userplan, 'User Plan Updated Successfully'));
});


const getAllUserPlanDetails = asyncHandler(async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: 'userplans',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'userPlans',
                    pipeline: [
                        {
                            $project: {
                                startDate: 1,
                                endDate: 1,
                                usedMsgCount: 1,
                                planId: 1,
                            }
                        }
                    ]

                }
            },
            { $unwind: { path: "$userPlans", preserveNullAndEmptyArrays: true } }, // Unwind userPlans (if exists)
            {
                $lookup: {
                    from: "plans", // Collection name in MongoDB
                    localField: "userPlans.planId",
                    foreignField: "_id",
                    as: "userPlans.planDetails",
                    pipeline: [{
                        $project: {
                            _id: 0,
                            createdAt: 0,
                            updatedAt: 0,
                        }
                    }]
                },
            },
            { $unwind: { path: "$userPlans.planDetails", preserveNullAndEmptyArrays: true } }, // Unwind plan details
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'members'
                }
            },
            {
                $addFields: {
                    memberCount: { $size: "$members" }
                }
            },
            {
                $project: {
                    address: 0,
                    password: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                    members: 0,
                    userId: 0,

                }
            },
        ]);

        if (!users) {
            return res.status(404).json(new APIResponse(404, {}, 'User Not Found'))
        }
        return res.status(200).json(new APIResponse(200, users, 'All Users Plans Fetched'));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'))
    }
})

const getUserPlanDetails = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User Id'))
    }
    try {
        const users = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'userplans',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'userPlans',
                    pipeline: [
                        {
                            $project: {
                                startDate: 1,
                                endDate: 1,
                                usedMsgCount: 1,
                                planId: 1,
                                // _id: 0,
                            }
                        }
                    ]

                }
            },
            { $unwind: { path: "$userPlans", preserveNullAndEmptyArrays: true } }, // Unwind userPlans (if exists)
            {
                $lookup: {
                    from: "plans", // Collection name in MongoDB
                    localField: "userPlans.planId",
                    foreignField: "_id",
                    as: "userPlans.planDetails",
                    pipeline: [{
                        $project: {
                            _id: 0,
                            createdAt: 0,
                            updatedAt: 0,
                        }
                    }]
                },
            },
            { $unwind: { path: "$userPlans.planDetails", preserveNullAndEmptyArrays: true } }, // Unwind plan details
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'members'
                }
            },
            {
                $addFields: {
                    memberCount: { $size: "$members" }
                }
            },
            {
                $project: {
                    address: 0,
                    password: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    userId: 0,
                    __v: 0,
                    members: 0,
                }
            },
        ]);

        if (!users) {
            return res.status(404).json(new APIResponse(404, {}, 'User Not Found'))
        }
        return res.status(200).json(new APIResponse(200, users, 'All Users Plans Fetched'));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'))
    }
})


// const updateUsedMsgCount = asyncHandler(async (req, res) => {

//     const usedMsgCount = req.body;
//     if (!usedMsgCount || isNaN(parseInt(usedMsgCount))) {
//         return res.status(400).json(new APIResponse(400, {}, 'usedMsgCount must be Integer'))
//     }


//     const userplan = await UserPlan.findOneAndUpdate(
//         {
//             userId: req.user._id
//         },
//         {
//             $set: {
//                 usedMsgCount: usedMsgCount
//             }
//         }, { new: true }
//     )

//     if (!userplan) {
//         return res.status(404).json(new APIResponse(404, {}, 'User Plan Not Found'))
//     }
//     return res.status(200).json(new APIResponse(200,userplan,'Used Message Count Updated'))
// })


const getActivePlan = asyncHandler(async (req, res) => {
    const userId = req.user?.role === 'user' ? req.user._id : req.user?.role === 'member' ? req.user.userId : null;

    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User Id'))
    }
    try {
        const users = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'userplans',
                    localField: "_id",
                    foreignField: 'userId',
                    as: 'userPlans',
                    pipeline: [
                        {
                            $project: {
                                startDate: 1,
                                endDate: 1,
                                usedMsgCount: 1,
                                planId: 1,
                                // _id: 0,
                            }
                        }
                    ]

                }
            },
            { $unwind: { path: "$userPlans", preserveNullAndEmptyArrays: true } }, // Unwind userPlans (if exists)
            {
                $lookup: {
                    from: "plans", // Collection name in MongoDB
                    localField: "userPlans.planId",
                    foreignField: "_id",
                    as: "userPlans.planDetails",
                    pipeline: [{
                        $project: {
                            _id: 0,
                            createdAt: 0,
                            updatedAt: 0,
                        }
                    }]
                },
            },
            { $unwind: { path: "$userPlans.planDetails", preserveNullAndEmptyArrays: true } }, // Unwind plan details
            {
                $project: {
                    address: 0,
                    password: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            },
        ]);

        if (!users) {
            return res.status(404).json(new APIResponse(404, {}, 'User Not Found'))
        }
        return res.status(200).json(new APIResponse(200, users, 'All Users Plans Fetched'));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'))
    }
})

const updateUsedMsgCount = asyncHandler(async (req, res) => {
    const userId = req.user?.role === 'user' ? req.user._id : req.user?.role === 'member' ? req.user.userId : null;
    const additionalMsgCount = Number(req.body.usedMsgCount);

    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid User ID"));
    }

    if (isNaN(additionalMsgCount) || additionalMsgCount <= 0) {
        return res.status(400).json(new APIResponse(400, {}, 'usedMsgCount must be a positive integer'));
    }

    // Get current date
    const currentDate = new Date();

    // Find the active user plan
    const userPlan = await UserPlan.findOne({
        userId,
        startDate: { $lte: currentDate }, // Plan started
        endDate: { $gte: currentDate }    // Plan not expired
    }).populate('planId');

    if (!userPlan) {
        return res.status(400).json(new APIResponse(400, {}, 'Plan Expired or Not Found'));
    }

    if (!userPlan.planId || typeof userPlan.planId.smsCount !== 'number' || typeof userPlan.planId.userSMSCount !== 'number') {
        return res.status(500).json(new APIResponse(500, {}, 'Plan details missing SMS count or userSmsCount'));
    }


    // Get SMS limits from the associated plan
    const { smsCount, userSMSCount } = userPlan.planId;

    // Check if adding new messages exceeds either limit

    const newUsedMsgCount = userPlan.usedMsgCount + additionalMsgCount;
    if (newUsedMsgCount > smsCount && newUsedMsgCount > userSMSCount) {
        return res.status(400).json(new APIResponse(400, {}, 'SMS limit exceeded'));
    }

    // Update usedMsgCount
    userPlan.usedMsgCount = newUsedMsgCount;
    await userPlan.save();

    return res.status(200).json(new APIResponse(200, userPlan, 'Used Message Count Updated'));
});





export {
    updateUserPlan,
    getAllUserPlanDetails,
    getUserPlanDetails,

    //mobile user
    getActivePlan,
    updateUsedMsgCount,
}