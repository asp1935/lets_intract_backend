import { asyncHandler } from "../utils/AsyncHandler.js";
import { Associate } from '../models/associate.model.js';
import { isValidObjectId } from "mongoose";
import { APIResponse } from "../utils/APIResponse.js";
import { Otp } from "../models/otp.model.js";


const addAsscociate = asyncHandler(async (req, res) => {
    const { name, email, mobile, state, district, taluka, otp } = req.body;



    if ([name, email, mobile, state, district, taluka, otp].some(field => field.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fileds Are Required'));
    }

    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
    }
    //check email already exist
    const existedAssociate = await Associate.exists({ $or: [{ email }, { mobile }] });
    if (existedAssociate) {
        return res.status(409).json(new APIResponse(409, {}, 'Associate Already Exist!!!'));
    }
    // Verify OTP
    const otpRecord = await Otp.findOne({ mobile });

    // Check if OTP record exists
    if (!otpRecord) {
        return res.status(400).json(new APIResponse(400, {}, 'OTP not found. Please request a new one.'));
    }

    // Check if the provided OTP is correct
    if (otpRecord.otp !== otp) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid OTP.'));
    }

    // Check if the OTP is expired
    if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteOne({ mobile });  // Remove expired OTP from DB
        return res.status(400).json(new APIResponse(400, {}, 'OTP expired.'));
    }

    // OTP verified, delete OTP from DB after successful verification
    await Otp.deleteOne({ mobile });
    //store into db
    const associate = await Associate.create({
        name,
        email,
        mobile,
        state,
        district,
        taluka,
    });

    const createdAssociate = await Associate.findById(associate._id);
    if (!createdAssociate) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while Creating Associate'))
    }
    return res.status(201).json(new APIResponse(200, createdAssociate, "Associate Registered Successfully")
    )
});

const updateAssociate = asyncHandler(async (req, res) => {

    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Associate ID'))
    }

    const { name, email, mobile, state, district, taluka } = req.body;
    if ([name, email, state, district, taluka].some(field => field.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fileds Are Required'));
    }

    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
    }


    const updatedAssociate = await Associate.findByIdAndUpdate(id,
        {
            $set: {
                name, email, mobile, state, taluka, district
            }
        },
        { new: true }
    ).select('-password')

    if (!updatedAssociate) {
        return res.status(404).json(new APIResponse(404, {}, 'Associate Not Found'))
    }

    return res.status(200).json(new APIResponse(200, updatedAssociate, ' Associate Updated Successfully'))
});

const deletedAssociate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Associate ID"));
    }
    const deletedAssociate = await Associate.findByIdAndDelete(id);
    if (!deletedAssociate) {
        return res.status(500).json(new APIResponse(500, {}, 'Associate Already Deleted'))
    }
    return res.status(200).json(new APIResponse(200, deletedAssociate, 'Associate Successfully Deleted'))
});

const getAssociates = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Associate ID"));
    }

    const whereCondition = id ? { _id: new mongoose.Types.ObjectId(id) } : {}; // Ensure _id is ObjectId

    try {
        const associates = await Associate.aggregate([
            { $match: whereCondition }, // Match specific Associate if id is provided

            // Lookup referrals based on associateId
            {
                $lookup: {
                    from: "referrals",  // Ensure this matches your actual collection name
                    localField: "_id",  // Associate ID
                    foreignField: "associateId",  // Field in referrals table
                    as: "referralData"
                }
            },
            {
                $addFields: {
                    totalReferralCount: { $size: "$referralData" } // Count number of referrals
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    mobile: 1,
                    state: 1,
                    district: 1,
                    taluka: 1,
                    commission: 1,
                    referralCount: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalReferralCount: 1
                }
            }
        ]);

        if (!associates || associates.length === 0) {
            return res.status(200).json(new APIResponse(200, {}, "No Associate Found"));
        }

        return res.status(200).json(new APIResponse(200, associates, "Associates Fetched"));
    } catch (error) {
        console.error("Error fetching associates:", error);
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});


const updateAllAssoCommission = asyncHandler(async (req, res) => {
    const { commission } = req.body;

    if (typeof commission !== 'number' || commission < 0) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid commission value'));
    }

    try {
        const result = await Associate.updateMany({}, { $set: { commission } });

        if (result.modifiedCount === 0) {
            return res.status(404).json(new APIResponse(400, {}, 'No associates found to update'));
        }

        res.status(200).json(new APIResponse(400, { updatedCount: result.modifiedCount }, 'Commission updated for all associates successfully!'));
    } catch (error) {
        console.error('Error updating commissions:', error);
        res.status(500).json(new APIResponse(400, {}, 'Internal server error'));
    }
});

const updateCommission = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { commission } = req.body;

    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Associate ID"));
    }
    if (isNaN(commission) || commission < 0) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Commission Amount"));
    }

    const associate = await Associate.findByIdAndUpdate(id, {
        $set: {
            commission
        }
    }, { new: true });

    if (!associate) {
        return res.status(404).json(new APIResponse(404, {}, 'Associate Not Found'))
    }

    return res.status(200).json(new APIResponse(200, associate, "Associate Commission Updated"));


});

const updateReferralCountZero = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Associate Refarral Count is Updated"));
    }

    const associate = await Associate.findByIdAndUpdate(id,
        {
            $set: {
                referralCount: 0
            }
        }, {
        new: true
    }
    );
    if (!associate) {
        return res.status(404).json(new APIResponse(404, {}, "Associate Not Found"));
    }
    return res.status(200).json(new APIResponse(200, associate, "Associate Referral Count Updated"))
});

const getAllAssociateReferralCount = asyncHandler(async (req, res) => {
    try {
        const associatesWithReferralCount = await Associate.aggregate([
            {
                $lookup: {
                    from: "referrals", // Match the collection name for referrals
                    localField: "_id",
                    foreignField: "associateId",
                    as: "referrals"
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    referralCount: 1,
                    referralCountFromReferrals: { $size: "$referrals" }
                }
            }
        ]);

        return res.status(200).json(new APIResponse(200, associatesWithReferralCount, "Associates with Referral Counts Fetched Successfully"));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const getAssociateReferralUsers = asyncHandler(async (req, res) => {
    const { userType } = req.query; // Get userType from query params

    const matchUserType = userType ? { "referredUsers.type": userType } : {};
    try {
        const associateReferralUser = await Associate.aggregate([
            {
                $lookup: {
                    from: "referrals",
                    localField: "_id",
                    foreignField: "associateId",
                    as: "referrals"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "referrals.userId",
                    foreignField: "_id",
                    as: "referredUsers"
                }
            },
            {
                $unwind: {
                    path: "$referredUsers",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: matchUserType // Filter by userType if provided
            },
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
            {
                $group: {
                    _id: "$_id",
                    rname: { $first: "$name" },
                    rmobile: { $first: "$mobile" },
                    remail: { $first: "$email" },
                    referrCount: { $first: "$referrCount" },
                    commission: { $first: "$commission" },
                    totalReferralCount: { $first: { $size: "$referrals" } },
                    referredUsers: {
                        $push: {
                            _id: "$referredUsers._id",
                            name: "$referredUsers.name",
                            email: "$referredUsers.email",
                            mobile: "$referredUsers.mobile",
                            type: "$referredUsers.type",
                            createdAt: "$referredUsers.createdAt",
                            plan: {
                                _id: "$planDetails._id",
                                name: "$planDetails.name",
                                price: "$planDetails.price",
                                type: "$planDetails.type"
                            }
                        }
                    }
                }
            }
        ]);
        return res.status(200).json(new APIResponse(200, associateReferralUser, "Associates with Referral & Plan Details Fetched Successfully"));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});




export {
    addAsscociate,
    updateAssociate,
    deletedAssociate,
    getAssociates,
    updateAllAssoCommission,
    updateCommission,
    updateReferralCountZero,
    getAllAssociateReferralCount,
    getAssociateReferralUsers,
}