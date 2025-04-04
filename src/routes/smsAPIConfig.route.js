import {Router} from 'express';
import {authAllUserRole, verifyJWT, verifyJWTUser} from '../middleware/auth.middleware.js'
import { deleteSmsAPIConfig, getAllSmsConfigs, getSmsAPIConfigByUserId, getSmsAPIConfigMobile, upsertSMSAPIConfig } from '../controllers/smsAPIConfig.controller.js';

const router=Router();



router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,message:'SMS API Config Route Working Fine'})
})

router.route('/upsert-config').post(verifyJWT,upsertSMSAPIConfig);
router.route('/delete-config/:userId').delete(verifyJWT,deleteSmsAPIConfig);
router.route('/get-config').get(verifyJWT,getAllSmsConfigs);
router.route('/get-config/:userId').get(verifyJWT,getSmsAPIConfigByUserId);

//mobile user
router.route('/get-mobile-config').get(verifyJWTUser,authAllUserRole,getSmsAPIConfigMobile);



export default router;