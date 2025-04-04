// import { isValidObjectId } from "mongoose";
// import { asyncHandler } from "../utils/AsyncHandler.js";
// import { APIResponse } from "../utils/APIResponse.js";
// import { Member } from "../models/members.model.js";
// import path from 'path';
// import csv from 'csv-parser';
// import fs from 'fs';


// //this method for genrating refresh token and access token

// const genrateMemberAccessToken = async (memberId) => {
//     try {
//         const member = await Member.findById(memberId);

//         //genrate tokens
//         const accessToken = member.genrateAccessToken();

//         return accessToken

//     } catch (error) {
//         const errors = new Error('Something Went Wrong While Genrating Tokens')
//         errors.statusCode = 401;
//         throw errors
//     }
// };

// const addBulkMembers = asyncHandler(async (req, res) => {
//     const { userId, password = 'member@123' } = req.body;
//     const csvFilePath = req.file?.path;

//     if (!userId || !isValidObjectId(userId)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid USer ID'))
//     }
//     if (!csvFilePath) {
//         return res.status(400).json(new APIResponse(400, {}, "No CSV File Uploaded"));
//     }
//     const members = [];
//     const existingMobiles = new Set();
//     let skippedCount = 0;

//     // Fetch existing member mobile numbers for the user
//     const existingMembers = await Member.find({ userId }, 'memberMobile');
//     existingMembers.forEach(member => existingMobiles.add(member.memberMobile));

//     console.log(csvFilePath);
    

//     // Read CSV and parse data
//     fs.createReadStream(csvFilePath)
//         .pipe(csv({ headers: ['memberName', 'memberMobile'], skipLines: 1 }))
//         .on('data', (row) => {
            
//             if (row.memberName && row.memberMobile) {
//                 // Check for duplicate mobile number
//                 console.log(existingMobiles,row.memberMobile);
                
//                 if (!existingMobiles.has(row.memberMobile)) {
                    
//                     members.push({
//                         userId,
//                         memberName: row.memberName,
//                         memberMobile: row.memberMobile,
//                         password,

//                     });
//                     existingMobiles.add(row.memberMobile); // Add to set to prevent duplicates in same CSV
//                 } else {
//                     skippedCount++;
//                 }
//             }
//         })
//         .on('end', async () => {
//             try {

//                 // Insert unique members into the database
//                 if (members.length > 0) {
//                     await Member.insertMany(members);
//                 }
//                 fs.unlinkSync(csvFilePath);  // Clean up after upload

//                 return res.status(200).json(new APIResponse(200, {
//                     addedCount: members.length,
//                     skippedCount
//                 }, 'Members Uploaded Successfully'));
//             } catch (error) {
//                 console.error(error);
//                 return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
//             }
//         });
// })


// const addSingleMember = asyncHandler(async (req, res) => {
//     const userId = req.params.userId;
//     if (!isValidObjectId(userId)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
//     }

//     const { memberName, memberMobile, password = 'member@123' } = req.body;
//     if (!memberName || memberName.trim() === '') {
//         return res.status(400).json(new APIResponse(400, {}, 'Member Name is Required'));
//     }
//     if (memberMobile.length !== 10 || isNaN(parseInt(memberMobile))) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
//     }
//     //check email already exist
//     const existedMember = await Member.exists({ memberMobile });
//     if (existedMember) {
//         return res.status(409).json(new APIResponse(409, {}, 'Member Already Exist!!!'));
//     }
//     const newMember = await Member.create({ userId, memberName, memberMobile, password });
//     if (!newMember) {
//         return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error while adding members'))
//     }
//     return res.status(201).json(new APIResponse(201, newMember, "Member addedd Successfully"));
// });

// const updateMember = asyncHandler(async (req, res) => {
//     const id = req.params.id;
//     if (!isValidObjectId(id)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid Member ID'))
//     }

//     const { memberName, memberMobile } = req.body;
//     if (!memberMobile || !memberName) {
//         return res.status(400).json(new APIResponse(400, {}, 'Name & Mobile is  Required'));
//     }
//     // Check for duplicate mobile number (excluding current member)
//     const existingMember = await Member.findOne({ memberMobile, _id: { $ne: id } });
//     if (existingMember) {
//         return res.status(400).json(new APIResponse(400, {}, 'Mobile Number Already Exists'));
//     }
//     const updatedMember = await Member.findByIdAndUpdate(id,
//         {
//             $set: {
//                 memberMobile: memberMobile, memberName: memberName
//             },
//         },
//         { new: true, runValidators: true }
//     ).select("-password -__v");
//     if (!updatedMember) {
//         return res.status(404).json(new APIResponse(404, {}, 'Member Not Found'))
//     }
//     return res.status(200).json(new APIResponse(200, updatedMember, "Member Details Updated Successfully"));
// });

// const updateMemberActivation = asyncHandler(async (req, res) => {
//     try {
//         const id = req.params.id;
//         const status = req.body.status;

//         if (!isValidObjectId(id)) {
//             return res.status(400).json(new APIResponse(400, {}, 'Memmebr Id Is not Provided'))
//         }

//         if (!['verified', 'unverified'].includes(status)) {
//             return res.status(400).json(new APIResponse(400, {}, 'Invalid Member Status must be verified or unverified'))
//         }

//         const member = await Member.findById(id);

//         if (!member) {
//             return res.status(404).json(new APIResponse(404, {}, 'Member Not Found'));
//         }

//         if (!member.memberKey) {
//             return res.status(400).json(new APIResponse(400, {}, 'Member Key is Not Set'))
//         }


//         member.status = status;

//         await member.save();

//         return res.status(200).json(new APIResponse(200, member, 'Member Activation Status Updated'));
//     } catch (error) {
//         return res.status(500).json(new APIResponse(500, {}, 'Something went wrong While Updating Status'))
//     }
// });

// const updateMemberPassword = asyncHandler(async (req, res) => {
//     const id = req.params.id;
//     if (!isValidObjectId(id)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid Member Id'));
//     }
//     const newPassword = req.body.newPassword;

//     if (newPassword.trim() === '') {
//         return res.status(400).json(new APIResponse(400, {}, 'New Password is Required'))
//     }
//     const member = await Member.findById(id);
//     if (!member) {
//         return res.status(404).json(new APIResponse(404, {}, 'Member Not Found'))
//     }

//     member.password = newPassword;
//     //this line execute then in member.model file pre method trigger 
//     await member.save({ validateBeforeSave: false })

//     return res
//         .status(200)
//         .json(new APIResponse(200, "Password Change Succesfully..."))
// });



// const deleteMemberKey = asyncHandler(async (req, res) => {
//     const id = req.params.id;

//     if (!isValidObjectId(id)) {
//         return res.status(400).json(new APIResponse(400, {}, "Invalid Member ID"));
//     }

//     const member = await Member.findByIdAndUpdate(
//         id,
//         {
//             $set: { status: 'unverified', memberKey: null },
//         },
//         { new: true } // updated member is returned
//     ).lean(); // Improves performance by returning a plain object

//     if (!member) {
//         return res.status(404).json(new APIResponse(404, {}, "Member Not Found"));
//     }

//     return res.status(200).json(new APIResponse(200, member, "Member key deleted successfully"));
// });





// const deleteSingleMember = asyncHandler(async (req, res) => {
//     const id = req.params.id;

//     if (!isValidObjectId(id)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid Member ID'))
//     }

//     const deletedMember = await Member.findByIdAndDelete(id);
//     if (!deletedMember) {
//         return res.status(500).json(new APIResponse(500, {}, 'Member Already Deleted'))
//     }
//     return res.status(200).json(new APIResponse(200, deletedMember, 'Member Successfully Deleted'))
// });

// const deleteUserAllMember = asyncHandler(async (req, res) => {
//     const userId = req.params.userId;

//     // Check if userId is a valid 
//     if (!isValidObjectId(userId)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
//     }

//     // Delete all members associated with the given userId
//     const deletedResult = await Member.deleteMany({ userId });

//     if (deletedResult.deletedCount === 0) {
//         return res.status(404).json(new APIResponse(404, {}, 'No Members Found for This User'));
//     }

//     return res.status(200).json(new APIResponse(200, { deletedCount: deletedResult.deletedCount }, 'Members Successfully Deleted'));
// });

// const getSingleMember = asyncHandler(async (req, res) => {
//     const id = req.params.id;

//     if (!isValidObjectId(id)) {
//         return res.status(400).json(new APIResponse(400, {}, "Invalid Member ID"));
//     }
//     const member = await Member.findById(id);
//     if (!member) {
//         return res.status(404).json(new APIResponse(404, {}, 'Member Not Found'));
//     }
//     return res.status(200).json(new APIResponse(200, member, 'Member Details Fetched'))

// })

// const getMembers = asyncHandler(async (req, res) => {
//     const userId = req.params?.userId;

//     if (userId && !isValidObjectId(userId)) {
//         return res.status(400).json(new APIResponse(400, {}, 'Invlid User ID'));
//     }

//     const whereCondition = userId ? { userId } : {};
//     const members = await Member.find(whereCondition);

//     if (!members) {
//         return res.status(200).json(new APIResponse(200, {}, 'Members Not Available'))
//     }
//     return res.status(200).json(new APIResponse(200, members, "All Members Fetched"));
// });




// //Mobile member controller

// const loginMember = asyncHandler(async (req, res) => {
//     const { memberMobile, password } = req.body;

//     if (!memberMobile || !password) {
//         return res.status(400).json(new APIResponse(400, {}, 'Mobile & Password Is Required!!!'));
//     }
//     const member = await Member.findOne({ memberMobile });

//     if (!member) {
//         return res.status(404).json(new APIResponse(404, {}, 'Account Not Found!!!'));
//     }

//     const isPasswordValid = await member.isPasswordCorrect(password);

//     if (!isPasswordValid) {
//         return res.status(401).json(new APIResponse(401, {}, 'Invalid Password!!!'))
//     }

//     const accessToken = await genrateMemberAccessToken(member._id);

//     const loggedInMember = await Member.findById(member._id).select('-password')
//     const options = {
//         httpOnly: true,
//         secure: true,
//     };

//     const accessTokenOptions = {
//         ...options,
//         maxAge: 365 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
//     };


//     return res
//         .status(201)
//         .cookie("accessToken", accessToken, accessTokenOptions)
//         .json(
//             new APIResponse(200,
//                 {
//                     member: loggedInMember, accessToken
//                 },
//                 "Member Logged In Successfully..."
//             )
//         )

// });

// const logoutMember = asyncHandler(async (req, res) => {

//     const options = {
//         httpOnly: true,
//         secure: true,
//         // sameSite: 'Strict'  //Adding sameSite: 'Strict' to prevent CSRF attacks.
//     }

//     return res
//         .status(200)
//         .clearCookie('accessToken', options)
//         .json(new APIResponse(200, {}, "Member Logged Out Successfully!!!"))
// });

// const setVerifyMemberKey = asyncHandler(async (req, res) => {
//     try {
//         const member = await Member.findById(req.member?._id);
//         if (member?.memberKey && member?.status === 'verified') {
//             return res.status(409).json(new APIResponse(409, {}, 'Member Verification Already Done'));
//         } else if (member?.memberKey && member.status === 'unverified') {
//             return res.status(403).json(new APIResponse(403, {}, 'Verifiaction Will be done in 24 Hours'))
//         }
//         const androidId = req.body.androidId;
//         if (!androidId) {
//             return res.status(400).json(new APIResponse(400, {}, 'Unique Mobile Key Missing'))
//         }



//         const uniqueMemberKey = member?.memberMobile + androidId;
//         member.memberKey = uniqueMemberKey;
//         member.status = 'unverified';
//         // Save without triggering `pre('save')`
//         await member.save({ validateBeforeSave: false })
//         return res.status(200).json(new APIResponse(200, member, 'Activation Key is Genrated'))
//     } catch (error) {
//         return res.status(500).json(new APIResponse(500, {}, 'Somthing Went Wrong while setting member key'));
//     }
// });

// const getCurrentMember = asyncHandler(async (req, res) => {
//     try {
//         const currentMember = await Member.aggregate([
//             {
//                 $match: {
//                     _id: req.member._id,
//                 },
//             },
//             {
//                 $lookup: {
//                     from: 'userplans',
//                     localField: "userId",
//                     foreignField: 'userId',
//                     as: 'userPlan',
//                     pipeline: [
//                         {
//                             $project: {
//                                 startDate: 1,
//                                 endDate: 1,
//                                 usedMsgCount: 1,
//                                 planId: 1
//                             }
//                         }
//                     ]
//                 }
//             },
//             { $unwind: { path: "$userPlan", preserveNullAndEmptyArrays: true } }, // Corrected path to 'userPlan'
//             {
//                 $lookup: {
//                     from: "plans",
//                     localField: "userPlan.planId",
//                     foreignField: "_id",
//                     as: "planDetails",
//                     pipeline: [{
//                         $project: {
//                             _id: 0,
//                             createdAt: 0,
//                             updatedAt: 0,
//                         }
//                     }]
//                 }
//             },
//             { $unwind: { path: "$planDetails", preserveNullAndEmptyArrays: true } },

//             {
//                 $project: {
//                     password: 0,
//                     createdAt: 0,
//                     updatedAt: 0,
//                     __v: 0,
//                 }
//             },
//         ]);

//         // Check if currentMember exists (aggregate returns an array)
//         if (currentMember.length === 0) {
//             return res.status(404).json(new APIResponse(404, {}, 'Member Not Found'));
//         }

//         return res.status(200).json(new APIResponse(200, currentMember[0], 'Member Details Fetched'));
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
//     }
// });






// export {

//     addBulkMembers,
//     addSingleMember,
//     updateMember,
//     updateMemberActivation,
//     updateMemberPassword,
//     deleteMemberKey,
//     deleteSingleMember,
//     deleteUserAllMember,
//     getSingleMember,
//     getMembers,



//     //mobile controllers
//     loginMember,
//     logoutMember,
//     setVerifyMemberKey,
//     getCurrentMember


// }