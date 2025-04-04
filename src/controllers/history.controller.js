// import { History } from "../models/history.model.js";
// import { APIResponse } from "../utils/APIResponse.js";
// import { asyncHandler } from "../utils/AsyncHandler.js";

// const getAllHistory = asyncHandler(async (req, res) => {
//     const payments = await History.aggregate([
//         {
//             $lookup: {
//                 from: 'associates',
//                 localField: 'associateId',
//                 foreignField: '_id',
//                 as: 'associateDetails'
//             }
//         },
//         {
//             $project: {
//                 name: { $arrayElemAt: ["$associateDetails.name", 0] },
//                 mobile: { $arrayElemAt: ["$associateDetails.mobile", 0] },
//                 amount: 1,
//                 commission:1,
//                 refCount:1,
//                 createdAt: 1
//             }
//         }
//     ]);

//     if (!payments || payments.length === 0) {
//         return res.status(404).json(new APIResponse(404, {}, "No Payment History Available"));
//     }

//     return res.status(200).json(new APIResponse(200, payments, "Payment History Details Fetched"));
// });

// export {
//     getAllHistory,
// }


// Controller
import { History } from "../models/history.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const getAllHistory = asyncHandler(async (req, res) => {
    let { userType } = req.query;
    userType = userType.toLowerCase(); // Normalize case

    if (!['associate', 'staff'].includes(userType)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid userType. Must be 'associate' or 'staff'"));
    }

    const fromCollection = userType === 'associate' ? 'associates' : 'admins';

    const payments = await History.aggregate([
        {
            $lookup: {
                from: fromCollection,
                localField: 'reffererId',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        {
            $match: { "userDetails": { $ne: [] } } // Ensures only matched documents are included
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                name: "$userDetails.name",
                mobile: "$userDetails.mobile",
                email: "$userDetails.email",
                amount: 1,
                commission: 1,
                refCount: 1,
                paymentMode:1,
                createdAt: 1,

            }
        }
    ]);

    return res.status(200).json(new APIResponse(200, payments, payments.length ? "Payment History Details Fetched" : "No Payment History Available"));
});



export { getAllHistory };
