import { isValidObjectId } from "mongoose";
import { Enquiry } from "../models/enquiry.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Otp } from "../models/otp.model.js";

const addEnquiry = asyncHandler(async (req, res) => {
    const { name, mobile, email, state, district, taluka, password, cpassword, otp } = req.body;
    if ([name, email, state, district, taluka, password, cpassword, otp].some(field => String(field || '').trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All fields are required'));
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Mobile Invalid Mobile No'))
    }
    if (password !== cpassword) {
        return res.status(400).json(new APIResponse(400, {}, "Password and confirm password must be the same."))
    }
    //check email already exist
    const existingEnquiry = await Enquiry.exists({ $or: [{ email }, { mobile }] });
    if (existingEnquiry) {
        return res.status(409).json(new APIResponse(409, {}, 'Registration Already Done Support Team Connect you as soon as Possible'));
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
    const enquiry = await Enquiry.create({
        name,
        email,
        mobile,
        state,
        district,
        taluka,
        password
    });
    if (!enquiry) {
        return res.status(500).json(new APIResponse(500, {}, "Something went wrong while Submitting Enquriy"))
    }
    return res.status(201).json(new APIResponse(201, enquiry, "Registration Done Support Team Connect with you as soon as possbile"));
})

// Delete Enquiry
const deleteEnquiry = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid ID"))
        }
        const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

        if (!deletedEnquiry) {
            return res.status(404).json(new APIResponse(404, {}, "Enquiry not found."));
        }

        res.status(200).json(new APIResponse(200, {}, "Enquiry deleted successfully."));
    } catch (error) {
        res.status(500).json(new APIResponse(500, {}, "Something went wrong while Deleteing Enquriy"));
    }
});

// Update Status
const updateEnquiry = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ["pending", "approved"];
        if (!isValidObjectId(id)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid ID"))
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid status."));
        }

        const updatedEnquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedEnquiry) {
            return res.status(404).json(new APIResponse(404, {}, "Enquiry not found."));
        }

        res.status(200).json(new APIResponse(200, updatedEnquiry, "Status updated successfully."));
    } catch (error) {
        res.status(500).json(new APIResponse(500, {}, "Something went wrong while updating Queries"));
    }
});

const getAllEnquiries = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id && !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid Id"))
    }
    const whereCondition = id ? { _id: id } : {};
    const enquires = await Enquiry.find(whereCondition);
    if (!enquires || enquires.length === 0) {
        return res.status(200).json(new APIResponse(200, {}, 'Enquires Not Available'))
    }
    return res.status(200).json(new APIResponse(200, enquires, "Enquires Fetched Successfully"));
})

export {
    addEnquiry,
    updateEnquiry,
    deleteEnquiry,
    getAllEnquiries,
}