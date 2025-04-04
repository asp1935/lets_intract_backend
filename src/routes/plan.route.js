
import { Router } from "express";
import {body} from 'express-validator'
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addPlan, deletePlan, getPlans, getSinglePlan, updatePlan } from "../controllers/plan.controller.js";

const router=Router();

const validatePlan = [
    body("name").trim().notEmpty().withMessage("Plan name is required"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("validity").isInt({ min: 1 }).withMessage("Validity must be a positive integer"),
    body("smsAPIService").notEmpty().isBoolean().withMessage("smsAPIService must be a boolean"),
    body("whatsappAPIService").notEmpty().isBoolean().withMessage("whatsappAPIService must be a boolean"),
    body("smsCount").notEmpty().isInt({ min: 0 }).withMessage("smsCount must be a non-negative integer"),
    body("userSMSCount").notEmpty().isInt({ min: 0 ,max:100 }).withMessage("userSMSCount must be a non-negative integer & not more than 100"),
    body("addMembers").notEmpty().isBoolean().withMessage("addMembers must be a boolean"),
    body("type").notEmpty().withMessage("Type is required").isIn(["advance", "basic"]).withMessage("Type must be either 'advance' or 'basic'"),
];


router.get('/',(req,res)=>{ 
    return res.status(200).json({statusCode:200,message:'Plan Route Woring Fine'});
})
router.route('/add-plan').post(verifyJWT,validatePlan,addPlan);
router.route('/get-plan').get(verifyJWT,getPlans);
router.route('/get-plan/:id').get(verifyJWT,getSinglePlan);
router.route('/update-plan/:id').put(verifyJWT,validatePlan,updatePlan)
router.route('/delete-plan/:id').delete(verifyJWT,deletePlan);


export default router;


