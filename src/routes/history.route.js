import { Router } from "express";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";
import { getAllHistory } from "../controllers/history.controller.js";

const router=Router();

router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,message:"History Route Working"});
})

router.route('/get-history').get(verifyJWT,authAdmin,getAllHistory);

export default router;