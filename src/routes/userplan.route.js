import { Router } from "express";
import { authAllUserRole, verifyJWT, verifyJWTUser } from "../middleware/auth.middleware.js";
import { getActivePlan, getAllUserPlanDetails, getUserPlanDetails, updateUsedMsgCount, updateUserPlan } from "../controllers/userplan.controller.js";

const router=Router();

router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,message:'UserPlan Route Working Fine'})
});

router.route('/update-plan').post(verifyJWT,updateUserPlan);        //update user plan 
router.route('/get-userPlan-details').get(verifyJWT,getAllUserPlanDetails);         //all user details with plan
router.route('/get-userPlan-details/:userId').get(verifyJWT,getUserPlanDetails);    //sepcific user details


//mobile user 
router.route('/get-active-plan').get(verifyJWTUser,authAllUserRole,getActivePlan);    

router.route('/update-used-msg-count').patch(verifyJWTUser,authAllUserRole,updateUsedMsgCount);


 
export default router;