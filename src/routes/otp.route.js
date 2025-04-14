import {Router} from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {otpLimiter} from '../middleware/otp.middleware.js';
import { sendOpt } from '../controllers/otp.controller.js';

const router=Router();

router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,message:"OTP Router Working Fine"});
});

router.route('/send-otp').post(otpLimiter,sendOpt);

export default router;

