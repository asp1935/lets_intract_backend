import { validationResult } from "express-validator";
import { Plan } from "../models/plan.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { isValidObjectId } from "mongoose";

const addPlan = asyncHandler(async (req, res) => {
    //check is there any error while getting all values in route file 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new APIResponse(400, {}, errors['errors'][0].msg));
    }

    const { name, price, validity, smsAPIService, whatsappAPIService, smsCount, userSMSCount, addMembers, type } = req.body;


    //  Manual validation inside the controller

    // if (!name || typeof name !== "string" || name.trim().length === 0) {
    //     return res.status(400).json(new APIResponse(400, {}, "Plan name is required and must be a valid string"));
    // }
    // if (price === undefined || typeof price !== "number" || price < 0) {
    //     return res.status(400).json(new APIResponse(400, {}, "Price is required and must be a non-negative number"));
    // }
    // if (validity === undefined || !Number.isInteger(validity) || validity < 1) {
    //     return res.status(400).json(new APIResponse(400, {}, "Validity is required and must be a positive integer"));
    // }
    // if (smsAPIService !== undefined && typeof smsAPIService !== "boolean") {
    //     return res.status(400).json(new APIResponse(400, {}, "smsAPIService must be a boolean"));
    // }
    // if (whatsappAPIService !== undefined && typeof whatsappAPIService !== "boolean") {
    //     return res.status(400).json(new APIResponse(400, {}, "whatsappAPIService must be a boolean"));
    // }
    // if (smsCount === undefined || !Number.isInteger(smsCount) || smsCount < 0) {
    //     return res.status(400).json(new APIResponse(400, {}, "smsCount must be a non-negative integer"));
    // }
    // if (addMembers !== undefined && typeof addMembers !== "boolean") {
    //     return res.status(400).json(new APIResponse(400, {}, "addMembers must be a boolean"));
    // }



    // Check if the plan already exists
    const existingPlan = await Plan.findOne({ name, type });
    if (existingPlan) {
        return res.status(400).json(new APIResponse(400, {}, "Plan with this name already exists"));
    }

    //save data to db
    const newPlan = await Plan.create({
        name,
        price,
        validity,
        smsAPIService,
        whatsappAPIService,
        smsCount,
        userSMSCount,
        addMembers,
        type
    })

    if (!newPlan) {
        return res.status(500).json(new APIResponse(500, {}, 'Somthing Went Wrong while Adding Plan!!!'))
    }
    return res.status(200).json(new APIResponse(200, newPlan, 'Plan Added Successfully...'))

});

//get all Plans
const getPlans = asyncHandler(async (req, res) => {
    const allPlans = await Plan.find({});
    if (!allPlans) {
        return res.status(200).json(new APIResponse(200, {}, 'No Plans Available'))
    }
    return res.status(200).json(new APIResponse(200, allPlans, 'All Plans Fetched'))
});

//get sngle plan by id
const getSinglePlan = asyncHandler(async (req, res) => {
    const planId = req.params.id;

    if (!isValidObjectId(planId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Plan ID'))
    }

    const planDetails = await Plan.findById(planId);

    if (!planDetails) {
        return res.status(200).json(new APIResponse(200, {}, 'No Plan Available'))
    }
    return res.status(200).json(new APIResponse(200, planDetails, ' Plans Fetched'))
});

//update plan
const updatePlan = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json(new APIResponse(400, {}, errors['errors'][0].msg));
    }
    const { name, price, validity, smsAPIService, whatsappAPIService, smsCount, userSMSCount, addMembers, type } = req.body;

    const planId = req.params.id;

    if (!isValidObjectId(planId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Plan ID'))
    }




    const updatedPlan = await Plan.findByIdAndUpdate(req.params.id,
        {
            name,
            price,
            validity,
            smsAPIService,
            whatsappAPIService,
            smsCount,
            userSMSCount,
            addMembers,
            type
        }, { new: true });


    if (!updatedPlan) {
        return res.status(500).json(new APIResponse(500, {}, 'Plan Not Found'))
    }
    res.status(200).json(new APIResponse(200, updatedPlan, 'Plan Updated Successfully'));
})

const deletePlan = asyncHandler(async (req, res) => {
    const planId = req.params.id;

    if (!isValidObjectId(planId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Plan ID'))
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
        return res.status(404).json(new APIResponse(404, {}, "Plan not found"));
    }

    const deletedPlan = await Plan.findByIdAndDelete(planId);
    if (!deletedPlan) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while Deleteing Plan'))
    }
    return res.status(200).json(new APIResponse(200, deletedPlan, 'Plan Successfully Deleted'))
})

export {
    addPlan,
    getPlans,
    getSinglePlan,
    updatePlan,
    deletePlan

}