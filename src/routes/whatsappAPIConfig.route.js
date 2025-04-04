import {Router} from 'express';
import {authAllUserRole, verifyJWT, verifyJWTUser} from '../middleware/auth.middleware.js'
import { deleteWhatsappAPIConfig, getAllWhatsappAPIConfigs, getWhatsappAPIConfigByUserId, getWhatsappAPIConfigMobile, upsertWhatsappAPIConfig } from '../controllers/whatsappAPIConfig.controller.js';

const router=Router();



router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,message:'Whatsapp API Config Route Working Fine'})
})

router.route('/upsert-config').post(verifyJWT,upsertWhatsappAPIConfig);
router.route('/delete-config/:userId').delete(verifyJWT,deleteWhatsappAPIConfig);
router.route('/get-config').get(verifyJWT,getAllWhatsappAPIConfigs);
router.route('/get-config/:userId').get(verifyJWT,getWhatsappAPIConfigByUserId);

//mobile user
router.route('/get-mobile-config').get(verifyJWTUser,authAllUserRole,getWhatsappAPIConfigMobile);



export default router;
