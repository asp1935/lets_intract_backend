import { Router } from "express";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";
import { genratePayout, getAllPayout, pay } from "../controllers/payout.controller.js";
import { genrateStaffPayout, getAllStaffPayout, staffPay } from "../controllers/staffPayout.controller.js";

const router=Router();

router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,message:"Payout Route Working"});
})

router.route('/genrate-payout').get(verifyJWT,authAdmin,genratePayout);
router.route('/get-payout').get(verifyJWT,authAdmin,getAllPayout);
router.route('/pay/:id').post(verifyJWT,authAdmin,pay);


router.route('/genrate-staff-payout').get(verifyJWT,authAdmin,genrateStaffPayout);
router.route('/get-staff-payout').get(verifyJWT,authAdmin,getAllStaffPayout);
router.route('/staff-pay/:id').post(verifyJWT,authAdmin,staffPay);

export default router;