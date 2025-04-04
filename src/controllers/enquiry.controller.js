import { isValidObjectId } from "mongoose";
import { Enquiry } from "../models/enquiry.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const addEnquiry = asyncHandler(async (req, res) => {
    const { name, mobile, email, state, district, taluka } = req.body;
    if ([name, email, state, district, taluka,].some(field => field.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fileds Are Required'));
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json(new APIResponse(400, {}, 'Mobile Invalid Mobile No'))
    }
    //check email already exist
    const existingEnquiry = await Enquiry.exists({ $or: [{ email }, { mobile }] });
    if (existingEnquiry) {
        return res.status(409).json(new APIResponse(409, {}, 'Registration Already Done Support Team Connect you as soon as Possible'));
    }
    //store into db
    const enquiry = await Enquiry.create({
        name,
        email,
        mobile,
        state,
        district,
        taluka,
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

const getAllEnquiries=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    if(id && !isValidObjectId(id)){
        return res.status(400).json(new APIResponse(400,{},"Invalid Id"))
    }
    const whereCondition=id?{_id:id}:{};
    const enquires=await Enquiry.find(whereCondition);
    if(!enquires || enquires.length===0){
        return res.status(200).json(new APIResponse(200,{},'Enquires Not Available'))
    }
    return res.status(200).json(new APIResponse(200,enquires,"Enquires Fetched Successfully"));
})

export {
    addEnquiry,
    updateEnquiry,
    deleteEnquiry,
    getAllEnquiries,
}