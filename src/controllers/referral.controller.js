import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Associate } from "../models/associate.model.js";
import { User } from "../models/user.model.js";
import { Referral } from "../models/referral.model.js";


const addReferral = asyncHandler(async (req, res) => {
    const { id, userId } = req.body;
    console.log(id,userId);
    
    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Associate ID or User Id"))
    }
    const associte = await Associate.findById(id);
    if (!associte) {
        return res.status(404).json(new APIResponse(404, {}, "Associate Not Found"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new APIResponse(404, {}, "User Not Found"));
    }

    const newReferral = await Referral.create({ associateId: id, userId });
    if (!newReferral) {
        return res.status(500).json(new APIResponse(500, {}, "Something went wrong while adding associate"));
    }
    return res.status(201).json(new APIResponse(201, newReferral, "Referral Added "));
});

const updateReferral = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newAssociateId } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Inavlid Id"))
    }
    if (!isValidObjectId(newAssociateId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Associate Id"))
    }
    const referral = await Referral.findById(id);
    if (!referral) {
        return res.status(404).json(new APIResponse(404, {}, 'Referral Deatils Not Found'))
    }
    const updateAssociateCount = await Associate.findByIdAndUpdate(referral.associateId,
        {
            $inc: {
                referralCount: -1
            }
        },
        { new: true }
    )
    if (!updateAssociateCount) {
        return res.status(404).json(new APIResponse(400, {}, "Assoicate Not Found"))
    }
    referral.associateId = newAssociateId;
    await referral.save({ validateBeforeSave: false });

    return res.status(200).json(new APIResponse(200, referral, "Referral Updated Successfully"))

});

const deleteReferral = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate referral ID
    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Referral ID"));
    }

    // Fetch referral to get associateId and ensure it exists
    const referral = await Referral.findById(id);
    if (!referral) {
        return res.status(404).json(new APIResponse(404, {}, "Referral Details Not Found or Already Deleted"));
    }

    // Decrement referrCount for the associated associate
    const updateAssociateCount = await Associate.findByIdAndUpdate(
        referral.associateId,
        { $inc: { referralCount: -1 } },
        { new: true }
    );

    if (!updateAssociateCount) {
        return res.status(404).json(new APIResponse(404, {}, "Associate Not Found"));
    }

    // Delete the referral
    await Referral.findByIdAndDelete(id);

    return res.status(200).json(new APIResponse(200, {}, "Referral Details Deleted Successfully"));
});

export {
    addReferral,
    updateReferral,
    deleteReferral
};