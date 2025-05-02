import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import path from 'path';
import csv from 'csv-parser';
import fs from 'fs';
import { Otp } from "../models/otp.model.js";
import { Referral } from "../models/referral.model.js";
import { StaffRef } from "../models/staffRef.model.js";


//this method for genrating refresh token and access token

const genrateUserAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        //genrate tokens
        const accessToken = user.genrateAccessToken();
        return accessToken
    } catch (error) {
        const errors = new Error('Something Went Wrong While Genrating Tokens')
        errors.statusCode = 401;
        throw errors
    }
};

//for  admin for users

const registerUser = asyncHandler(async (req, res) => {
    // Extract fields from the request body
    const { name, email, mobile, state, district, taluka, type = "business", password, otp } = req.body;

    // Validate required fields
    if ([name, email, state, district, taluka, password, type, otp].some(field => String(field || '').trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required'));
    }

    // Validate user type
    if (!['business', 'political'].includes(type)) {
        return res.status(400).json(new APIResponse(400, {}, 'User type must be business or political'));
    }

    // Validate mobile number (should be exactly 10 digits)
    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
    }

    // Check if user already exists (either by email or mobile)
    const existedUser = await User.exists({ $or: [{ email }, { mobile }] });
    if (existedUser) {
        return res.status(409).json(new APIResponse(409, {}, 'User Already Exist!!!'));
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

    // Store new user in the database
    const user = await User.create({
        name,
        email,
        mobile,
        state,
        district,
        taluka,
        type,
        password,
    });

    // Retrieve the created user details (excluding sensitive fields)
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while Creating User'));
    }

    // Send success response with the created user details
    return res.status(201).json(new APIResponse(200, createdUser, "User Registered Successfully"));
});

//update User Details
const updateUser = asyncHandler(async (req, res) => {
    // Extract user ID from request params
    const { id } = req.params;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }

    // Extract fields from the request body
    const { name, email, state, district, taluka, type, mobile } = req.body;

    // Validate required fields
    if ([name, email, state, district, taluka, type].some(field => field.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required'));
    }

    // Validate user type
    if (!['business', 'political'].includes(type)) {
        return res.status(400).json(new APIResponse(400, {}, 'User type must be business or political'));
    }

    // Validate mobile number (should be exactly 10 digits)
    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
    }

    // Update user in the database and return the updated user (excluding password)
    const updatedUser = await User.findByIdAndUpdate(
        id,
        {
            $set: {
                name,
                email,
                mobile,
                state,
                taluka,
                district,
                type
            }
        },
        { new: true } // Return the updated document
    ).select('-password');

    // Check if user was found and updated
    if (!updatedUser) {
        return res.status(404).json(new APIResponse(404, {}, 'User Not Found'));
    }

    // Send success response with updated user details
    return res.status(200).json(new APIResponse(200, updatedUser, `${updatedUser.role === 'user' ? "User" : "Member"} Updated Successfully`));
});


// add bulk member using csv file
const addBulkMembers = asyncHandler(async (req, res) => {
    const { userId, password = 'member@123', role = 'memeber' } = req.body;
    const csvFilePath = req.file?.path;

    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid USer ID'))
    }
    if (!csvFilePath) {
        return res.status(400).json(new APIResponse(400, {}, "No CSV File Uploaded"));
    }
    const user = User.findById(userId);
    if (!user) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid User ID"))
    }
    const type = user?.type;

    const members = [];
    const existingMobiles = new Set();
    let skippedCount = 0;

    // Fetch existing member mobile numbers for the user
    const existingMembers = await User.find({ userId }, 'mobile');
    existingMembers.forEach(member => existingMobiles.add(member.mobile));



    // Read CSV and parse data
    fs.createReadStream(csvFilePath)
        .pipe(csv({ headers: ['name', 'mobile'], skipLines: 1 }))
        .on('data', (row) => {

            if (row.name && row.maxAgeobile) {
                // Check for duplicate mobile number

                if (!existingMobiles.has(row.mobile)) {

                    members.push({
                        userId,
                        name: row.name,
                        mobile: row.mobile,
                        type,
                        role,
                        password,

                    });
                    existingMobiles.add(row.mobile); // Add to set to prevent duplicates in same CSV
                } else {
                    skippedCount++;
                }
            }
        })
        .on('end', async () => {
            try {

                // Insert unique members into the database
                if (members.length > 0) {
                    await User.insertMany(members);
                }
                fs.unlinkSync(csvFilePath);  // Clean up after upload

                return res.status(200).json(new APIResponse(200, {
                    addedCount: members.length,
                    skippedCount
                }, 'Members Uploaded Successfully'));
            } catch (error) {
                console.error(error);
                return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
            }
        });
})

//add single member 
const addSingleMember = asyncHandler(async (req, res) => {
    // Extract user ID from request parameters
    const { userId } = req.params;

    // Validate if the provided userId is a valid MongoDB ObjectId
    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }

    // Check if the user exists with the provided userId
    const user = await User.findById(userId);
    if (!user) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid User ID"));
    }

    // Extract user type from the found user
    const type = user?.type;

    // Extract fields from the request body, with default values for password and role
    const { name, mobile, password = 'member@123', role = 'member', otp } = req.body;

    // Validate required fields (name and otp)
    if ([name, otp].some(field => field.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required'));
    }

    // Validate mobile number (should be exactly 10 digits)
    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
    }

    // Check if the member with the same mobile number already exists
    const existedMember = await User.exists({ mobile });
    if (existedMember) {
        return res.status(409).json(new APIResponse(409, {}, 'Member Already Exist!!!'));
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ mobile });

    // Check if OTP record exists
    if (!otpRecord) {
        return res.status(400).json(new APIResponse(400, {}, 'OTP not found. Please request a new one.'));
    }

    // Validate OTP
    if (otpRecord.otp !== otp) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid OTP.'));
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteOne({ mobile }); // Delete expired OTP from DB
        return res.status(400).json(new APIResponse(400, {}, 'OTP expired.'));
    }

    // OTP verified, delete OTP from DB
    await Otp.deleteOne({ mobile });

    // Create new member with extracted data
    const newMember = await User.create({ userId, name, mobile, password, type, role });

    // Check if member creation failed
    if (!newMember) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error while adding members'));
    }

    // Send success response with newly created member details
    return res.status(201).json(new APIResponse(201, newMember, "Member added Successfully"));
});

//update member
const updateMember = asyncHandler(async (req, res) => {
    // Extract member ID from request parameters
    const { id } = req.params;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Member ID'));
    }

    // Extract fields from the request body
    const { name, mobile } = req.body;

    // Check if name and mobile are provided
    if (!mobile || !name) {
        return res.status(400).json(new APIResponse(400, {}, 'Name & Mobile are Required'));
    }

    // Check for duplicate mobile number (excluding current member)
    const existingMember = await User.findOne({ mobile, _id: { $ne: id } });
    if (existingMember) {
        return res.status(400).json(new APIResponse(400, {}, 'Mobile Number Already Exists'));
    }

    // Update member with new details and ensure validators run
    const updatedMember = await User.findByIdAndUpdate(
        id,
        {
            $set: {
                mobile: mobile,
                name: name
            },
        },
        { new: true, runValidators: true }  // Ensures updated values are validated against the schema
    ).select("-password -__v");

    // Check if member was found and updated
    if (!updatedMember) {
        return res.status(404).json(new APIResponse(404, {}, 'Member Not Found'));
    }

    // Send success response with updated member details
    return res.status(200).json(new APIResponse(200, updatedMember, "Member Details Updated Successfully"));
});


//delte all user membner
const deleteUserAllMember = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }

    // Check if the user exists (optional, but provides clearer error messages)
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, 'User Not Found'));
    }

    // Delete all members associated with the given userId
    const deletedResult = await User.deleteMany({ userId });

    if (deletedResult.deletedCount === 0) {
        return res.status(404).json(new APIResponse(404, {}, 'No Members Found for This User'));
    }

    // Return the number of deleted members
    return res.status(200).json(new APIResponse(200, { deletedCount: deletedResult.deletedCount }, 'Members Successfully Deleted'));
});


// for both user & member
const updateVerification = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { verified } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
        }

        if (typeof verified !== 'boolean') {
            return res.status(400).json(new APIResponse(400, {}, 'Invalid User Verified Status'));
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json(new APIResponse(404, {}, 'User Not Found'));
        }

        if (!user.userKey) {
            return res.status(400).json(new APIResponse(400, {}, 'User Key is Not Set'));
        }

        user.verified = verified;
        await user.save();

        return res.status(200).json(new APIResponse(200, user, 'User Activation Verification Status Updated'));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while updating verification status'));
    }
});


const deleteUserKey = asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid User ID"));
    }

    const user = await User.findByIdAndUpdate(
        id,
        {
            $set: { verified: false, userKey: null },
        },
        { new: true } // updated user is returned
    ).lean(); // Improves performance by returning a plain object

    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, "User Not Found"));
    }

    return res.status(200).json(new APIResponse(200, user, "User key deleted successfully"));
});

const updatePassword = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newPassword } = req.body;
    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'))
    }
    if (newPassword.trim() === '') {
        return res.status(400).json(new APIResponse(400, {}, 'New Password is Required'))
    }
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, 'User Not Found'))
    }

    user.password = newPassword;
    //this line execute then in user.model file pre method trigger 
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new APIResponse(200, {}, "Password Change Succesfully..."))

})

const deleteUser = asyncHandler(async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'))
    }

    // const user = await User.findById(id);
    // if (!user) {
    //     return res.status(404).json(new APIResponse(404, {}, "User not found"));
    // }
    //  Delete referrals linked to the user
    await Referral.deleteOne({ userId: id });
    await StaffRef.deleteOne({ userId: id })

    // Delete members associated with the user
    await User.deleteMany({ userId: id });

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
        return res.status(500).json(new APIResponse(500, {}, 'User Already Deleted'))
    }
    return res.status(200).json(new APIResponse(200, deletedUser, 'User Successfully Deleted'))
})


// const getUser = asyncHandler(async (req, res) => {
//     const id = req.params?.id;
//     const role = req.query.role || "user";
//     const type=req.query.type 
//     let query = {};

//     if (id) {
//         query._id = id;
//     } else if (role) {
//         query.role = role;
//     }

//     const users = await User.find(query);

//     if (!users || users.length === 0) {
//         return res.status(200).json(new APIResponse(200, {}, 'No Users Available'));
//     }

//     return res.status(200).json(new APIResponse(200, users, 'Users Fetched'));
// });
const getUserDetails = asyncHandler(async (req, res) => {
    const id = req.params?.id;
    const role = req.query.role || "user";
    const type = req.query.type;

    // Validate role
    const validRoles = ["user", "member"];
    if (!validRoles.includes(role)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Role'));
    }

    // Validate type
    const validTypes = ["business", "political"];
    if (type && !validTypes.includes(type)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Type'));
    }

    // Construct match query
    let matchQuery = {};
    if (id) {
        try {
            matchQuery._id = new mongoose.Types.ObjectId(id); // Convert to ObjectId
        } catch (error) {
            return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
        }
    } else {
        matchQuery.role = role;
        if (role === "user" && type) {
            matchQuery.type = type;
        }
    }

    const users = await User.aggregate([
        { $match: matchQuery },

        // Count members linked to this user
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "userId",
                as: "members"
            }
        },
        { $addFields: { memberCount: { $size: "$members" } } },

        // Get referral details
        {
            $lookup: {
                from: "referrals",
                localField: "_id",
                foreignField: "userId",
                as: "referralDetails"
            }
        },
        { $unwind: { path: "$referralDetails", preserveNullAndEmptyArrays: true } },

        // Get staff details
        {
            $lookup: {
                from: "staffrefs",
                localField: "_id",
                foreignField: "userId",
                as: "staffDetails"
            }
        },
        { $unwind: { path: "$staffDetails", preserveNullAndEmptyArrays: true } },

        // Get associate details from associates table
        {
            $lookup: {
                from: "associates",
                localField: "referralDetails.associateId",
                foreignField: "_id",
                as: "associateDetails"
            }
        },
        { $unwind: { path: "$associateDetails", preserveNullAndEmptyArrays: true } },

        // Get staff details from admin table
        {
            $lookup: {
                from: "admins",
                localField: "staffDetails.staffId",
                foreignField: "_id",
                as: "staffInfo"
            }
        },
        { $unwind: { path: "$staffInfo", preserveNullAndEmptyArrays: true } },

        // Project only the required fields
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                mobile: 1,
                role: 1,
                type: 1,
                memberCount: 1,
                state: 1,
                district: 1,
                taluka: 1,
                verified: 1,
                userKey: 1,

                "members": {
                    _id: 1,
                    name: 1,
                    mobile: 1,
                    role: 1
                },
                // Pick name, email, password from associateDetails if available, else from staffInfo
                referralName: { $ifNull: ["$associateDetails.name", "$staffInfo.name"] },
                referralEmail: { $ifNull: ["$associateDetails.email", "$staffInfo.email"] },
                referralMobile: { $ifNull: ["$associateDetails.mobile", "$staffInfo.mobile"] },

                // // Include only name, mobile, email for associateDetails
                // "associateDetails.name": 1,
                // "associateDetails.mobile": 1,
                // "associateDetails.email": 1,

                // // Include only name, mobile, email for staffInfo
                // "staffInfo.name": 1,
                // "staffInfo.email": 1,
            }
        }
    ]);

    if (!users || users.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, 'No Users Available'));
    }

    return res.status(200).json(new APIResponse(200, users, 'Users Fetched'));
});




const getUser = asyncHandler(async (req, res) => {
    const id = req.params?.id;
    const role = req.query.role || "user";
    const type = req.query.type;

    // Validate role
    const validRoles = ["user", "member"];
    if (!validRoles.includes(role)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Role'));
    }

    // Validate type (only allowed when role is 'user' or 'member')
    const validTypes = ["business", "political"];
    if (type && !validTypes.includes(type)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Type'));
    }

    let query = {};

    if (id) {
        // If ID is provided, fetch the specific user
        query._id = id;
    } else {
        // Filter by role
        query.role = role;

        // Apply type filter only when role is 'user' or 'member'
        if (role === "user" && type) {
            query.type = type;
        }
    }

    // Fetch users based on the query
    const users = await User.find(query).select('-password');

    if (!users || users.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, 'No Users Available'));
    }

    return res.status(200).json(new APIResponse(200, users, 'Users Fetched'));
});

const getUserMembers = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid ID"))
    }
    const members = await User.find({ userId });

    if (!members || members.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, 'No Members Available'));
    }

    return res.status(200).json(new APIResponse(200, members, 'Users Fetched'));
});


const getMobileUserMembers = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const members = await User.find({ userId });

    if (!members || members.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, 'No Members Available'));
    }

    return res.status(200).json(new APIResponse(200, members, 'Users Fetched'));
});

// const getAllMembers = asyncHandler(async (req, res) => {
//     const users = await User.find({role:'member'});

//     if (!users) {
//         return res.status(200).json(new APIResponse(200, {}, 'No Member Available'))
//     }
//     return res.status(200).json(new APIResponse(200, users, 'All Members Fetched'))
// })

// //get all user by id
// const getSingleUser = asyncHandler(async (req, res) => {
//     const id = req.params.id;

//     if (!isValidObjectId(id)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid  ID'))
//     }

//     const userDetails = await User.findById(id);

//     if (!userDetails) {
//         return res.status(200).json(new APIResponse(200, {}, 'User Not Found'))
//     }
//     return res.status(200).json(new APIResponse(200, userDetails, ' User Details Fetched'))
// });

const setVerifyUserKey = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user?._id);
        const androidId = req.body.androidId;
        if (!androidId) {
            return res.status(400).json(new APIResponse(400, {}, 'Unique Mobile Key Missing'))
        }
        if (user?.userKey && user?.verified === true) {
            if (user.userKey === androidId) {
                return res.status(200).json(new APIResponse(200, {}, 'User Verification Done'));
            }
            else {
                return res.status(401).json(new APIResponse(401, {}, "Invalid User Mobile Key"))
            }
        } else if (user?.userKey && user.verified === false) {
            return res.status(403).json(new APIResponse(403, {}, 'Contact Support Team To Verify Account'))
        }



        const uniqueUserKey = androidId;
        user.userKey = uniqueUserKey;
        user.verified = false;
        // Save without triggering `pre('save')`
        await user.save({ validateBeforeSave: false })
        return res.status(200).json(new APIResponse(200, user, 'Activation Key is Genrated'))
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Somthing Went Wrong while setting user key'));
    }
})



//Mobile USer Route

const loginMobileUser = asyncHandler(async (req, res) => {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.status(400).json(new APIResponse(400, {}, 'Mobile & Password Is Required!!!'));
    }
    const user = await User.findOne({ mobile });

    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, 'Account Not Found!!!'));
    }

    const isPasswordValid = await user.isPasswordCorrect((password).toString());

    if (!isPasswordValid) {
        return res.status(401).json(new APIResponse(401, {}, 'Invalid Password!!!'))
    }

    const accessToken = await genrateUserAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select('-password')
    const options = {
        httpOnly: true,
        secure: true,
    };

    const accessTokenOptions = {
        ...options,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
    };


    return res
        .status(201)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .json(
            new APIResponse(200,
                {
                    user: loggedInUser, accessToken
                },
                " Logged In Successfully..."
            )
        )

});


const logoutMobileUser = asyncHandler(async (req, res) => {

    const options = {
        httpOnly: true,
        secure: true,
        // sameSite: 'Strict'  //Adding sameSite: 'Strict' to prevent CSRF attacks.
    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .json(new APIResponse(200, {}, " Logged Out Successfully!!!"))
});





const getCurrentMobileUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.role === 'user' ? req.user._id : req.user._id;

        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'userplans',
                    localField: req.user.role === 'user' ? '_id' : 'userId',
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
            { $unwind: { path: "$userPlans", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "plans",
                    localField: "userPlans.planId",
                    foreignField: "_id",
                    as: "userPlans.planDetails",
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                createdAt: 0,
                                updatedAt: 0,
                            }
                        }
                    ]
                },
            },
            { $unwind: { path: "$userPlans.planDetails", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    state: 0,
                    district: 0,
                    taluka: 0,
                    password: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            },
        ]);

        if (!user || user.length === 0) {
            return res.status(404).json(new APIResponse(404, {}, 'User Not Found'));
        }

        return res.status(200).json(new APIResponse(200, user[0], 'User Details Fetched'));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
    }
});





export {

    //user add-update
    registerUser,
    updateUser,
    getUserMembers,

    //member add-update-bulk
    addBulkMembers,
    addSingleMember,
    updateMember,
    deleteUserAllMember,


    //all user
    updatePassword,
    deleteUser,
    getUser,
    getUserDetails,
    // getAllMembers,
    // getSingleUser,
    updateVerification,
    deleteUserKey,

    //mobile user 
    loginMobileUser,
    logoutMobileUser,
    getCurrentMobileUser,
    setVerifyUserKey,
    getMobileUserMembers,
}