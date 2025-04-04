import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { StaffRef } from "../models/staffRef.model.js";
import { Referral } from "../models/referral.model.js";


const addStaffReferral = asyncHandler(async (req, res) => {
    const { id, userId } = req.body;
    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Staff ID or User Id"))
    }
    const staff = await Admin.findById(id);
    if (!staff) {
        return res.status(404).json(new APIResponse(404, {}, "Staff Not Found"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, "User Not Found"));
    }

    const newReferral = await StaffRef.create({ staffId: id, userId });
    if (!newReferral) {
        return res.status(500).json(new APIResponse(500, {}, "Something went wrong while adding associate"));
    }
    return res.status(201).json(new APIResponse(201, newReferral, "Referral Added "));
});

const updateStaffReferral = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newstaffId } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Inavlid Id"))
    }
    if (!isValidObjectId(newstaffId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Staff Id"))
    }
    const referral = await StaffRef.findById(id);
    if (!referral) {
        return res.status(404).json(new APIResponse(404, {}, 'Referral Deatils Not Found'))
    }
    const updateStaffCount = await Admin.findByIdAndUpdate(referral.staffId,
        {
            $inc: {
                referralCount: -1
            }
        },
        { new: true }
    )
    if (!updateStaffCount) {
        return res.status(404).json(new APIResponse(400, {}, "Assoicate Not Found"))
    }
    referral.staffId = newstaffId;
    await referral.save({ validateBeforeSave: false });

    return res.status(200).json(new APIResponse(200, referral, "Referral Updated Successfully"))

});

const deleteStaffReferral = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate referral ID
    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Referral ID"));
    }

    // Fetch referral to get staffId and ensure it exists
    const referral = await StaffRef.findById(id);
    if (!referral) {
        return res.status(404).json(new APIResponse(404, {}, "Referral Details Not Found or Already Deleted"));
    }

    // Decrement referrCount for the associated staff
    const updateStaffCount = await Admin.findByIdAndUpdate(
        referral.staffId,
        { $inc: { referralCount: -1 } },
        { new: true }
    );

    if (!updateStaffCount) {
        return res.status(404).json(new APIResponse(404, {}, "Staff Not Found"));
    }

    // Delete the referral
    await StaffRef.findByIdAndDelete(id);

    return res.status(200).json(new APIResponse(200, {}, "Referral Details Deleted Successfully"));
});



const getStaffReferralUsers = asyncHandler(async (req, res) => {
    const { userType } = req.query;

    try {
        const staffReferralUser = await StaffRef.aggregate([
            // Lookup Staff Details
            {
                $lookup: {
                    from: "admins",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staff"
                }
            },
            {
                $unwind: {
                    path: "$staff",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup Referred Users
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "referredUsers"
                }
            },
            // Unwind referredUsers to process each separately
            {
                $unwind: {
                    path: "$referredUsers",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Filter by userType (Apply early for efficiency)
            {
                $match: userType ? { "referredUsers.type": userType } : {}
            },
            // Lookup User Plans
            {
                $lookup: {
                    from: "userplans",
                    localField: "referredUsers._id",
                    foreignField: "userId",
                    as: "userPlans"
                }
            },
            {
                $unwind: {
                    path: "$userPlans",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup Plan Details
            {
                $lookup: {
                    from: "plans",
                    localField: "userPlans.planId",
                    foreignField: "_id",
                    as: "planDetails"
                }
            },
            {
                $unwind: {
                    path: "$planDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Group by Staff ID
            {
                $group: {
                    _id: "$staff._id",
                    rname: { $first: "$staff.name" },
                    remail: { $first: "$staff.email" },
                    referrCount: { $first: "$staff.referralCount" },
                    incentive: { $first: "$staff.incentive" },

                    referredUsers: {
                        $push: {
                            _id: "$referredUsers._id",
                            name: "$referredUsers.name",
                            email: "$referredUsers.email",
                            mobile: "$referredUsers.mobile",
                            type: "$referredUsers.type",
                            type: "$referredUsers.createdAt",
                            plan: {
                                _id: "$planDetails._id",
                                name: "$planDetails.name",
                                price: "$planDetails.price",
                                type: "$planDetails.type"
                            }
                        }
                    }
                }
            },
            // Calculate total referral count properly
            {
                $addFields: {
                    totalReferralCount: { $size: "$referredUsers" }
                }
            }
        ]);

        return res.status(200).json(new APIResponse(200, staffReferralUser, "Staff with Referral & Plan Details Fetched Successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const getStaff = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Staff ID"));
    }

    try {
        const matchStage = {}; // Define the filtering condition
        if (id) {
            matchStage.staffId = new mongoose.Types.ObjectId(id);
        }

        const associates = await StaffRef.aggregate([
            { $match: matchStage }, // Filter by staffId if provided

            // Lookup staff details from the "admins" collection
            {
                $lookup: {
                    from: "admins", // Ensure this matches the actual collection name
                    localField: "staffId",
                    foreignField: "_id",
                    as: "staffDetails"
                }
            },
            { $unwind: "$staffDetails" }, // Convert array into an object

            // Group by staffId to count the number of refUserId (referrals)
            {
                $group: {
                    _id: "$staffId",
                    name: { $first: "$staffDetails.name" },
                    email: { $first: "$staffDetails.email" },
                    incentive: { $first: "$staffDetails.incentive" },
                    referralCount: { $first: "$staffDetails.referralCount" },
                    createdAt: { $first: "$staffDetails.createdAt" },
                    updatedAt: { $first: "$staffDetails.updatedAt" },
                    totalReferralCount: { $sum: 1 } // Count the number of refUserId
                }
            },

            // Project the final structure
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    mobile: 1,
                    state: 1,
                    district: 1,
                    taluka: 1,
                    incentive: 1,
                    referralCount: 1,
                    totalReferralCount: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        if (!associates.length) {
            return res.status(404).json(new APIResponse(404, {}, "No Staff Found"));
        }

        return res.status(200).json(new APIResponse(200, associates, "Staff Fetched"));
    } catch (error) {
        console.error("Error fetching staff:", error);
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const updateAllStaffIncentive = asyncHandler(async (req, res) => {
    const { incentive } = req.body;

    if (typeof incentive !== 'number' || incentive < 0) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid incentive value'));
    }

    try {
        const result = await Admin.updateMany({ role: "user" }, { $set: { incentive } });

        if (result.modifiedCount === 0) {
            return res.status(404).json(new APIResponse(400, {}, 'No staff found to update'));
        }

        res.status(200).json(new APIResponse(400, { updatedCount: result.modifiedCount }, 'Incentive updated for all Staff successfully!'));
    } catch (error) {
        console.error('Error updating Incentive:', error);
        res.status(500).json(new APIResponse(400, {}, 'Internal server error'));
    }
});

const updateIncentive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { incentive } = req.body;

    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Associate ID"));
    }
    if (isNaN(incentive) || incentive < 0) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Commission Amount"));
    }

    const staff = await Admin.findByIdAndUpdate(id, {
        $set: {
            incentive
        }
    }, { new: true });

    if (!staff) {
        return res.status(404).json(new APIResponse(404, {}, 'Staff Not Found'))
    }

    return res.status(200).json(new APIResponse(200, staff, "Staff incentive Updated"));


});

const getStaffReferCnt = asyncHandler(async (req, res) => {
    try {
        const { referby, id } = req.query;
        if (!referby || referby.trim() === '' || !['staff', 'associate'].includes(referby)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid ReferBy Value"))
        }
        if (referby === 'staff') {
            if (id) {

                if (!isValidObjectId(id)) {
                    return res.status(200).json(new APIResponse(200, {}, 'Invalid Staff ID'))
                }
                // Get referral count for a specific staffId
                const referralCount = await StaffRef.countDocuments({ staffId: id });

                return res.status(200).json({ statusCode: 200, totalReferrals: referralCount, message: "Staff Referral Count Fetched" });
            } else {
                // Get total referrals count for all staff
                const totalReferrals = await StaffRef.countDocuments();
                return res.status(200).json({ statusCode: 200, totalReferrals: totalReferrals, message: "Total Staff Referral Count Fetched" });
            }
        } else {
            if (id) {

                if (!isValidObjectId(id)) {
                    return res.status(200).json(new APIResponse(200, {}, 'Invalid Associate ID'))
                }
                // Get referral count for a specific staffId
                const referralCount = await Referral.countDocuments({ associateId: id });

                return res.status(200).json({ statusCode: 200, totalReferrals: referralCount, message: "Associate Referral Count Fetched" });
            } else {
                // Get total referrals count for all staff
                const totalReferrals = await Referral.countDocuments();
                return res.status(200).json({ statusCode: 200, totalReferrals: totalReferrals, message: "Total Associate Referral Count Fetched" });
            }
        }
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"))
    }
});





export {
    addStaffReferral,
    updateStaffReferral,
    deleteStaffReferral,
    getStaffReferralUsers,
    getStaff,
    updateAllStaffIncentive,
    updateIncentive,
    getStaffReferCnt,
};