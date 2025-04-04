import { Router } from "express";
import { authAllUserRole, verifyJWT, verifyJWTUser } from "../middleware/auth.middleware.js";
import { addSmsTemplete, deleteSmsTemplete, getTempletesByMobileUSer, getTempletesByUser, getTemplets, updateSmsTemplete } from "../controllers/smsTemplete.controller.js";

const router =Router();

router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,mesage:'Whatsapp Templete Route Working'})
})

router.route('/add-templete').post(verifyJWT,addSmsTemplete);
router.route('/update-templete/:id').patch(verifyJWT,updateSmsTemplete);
router.route('/delete-templete/:id').delete(verifyJWT,deleteSmsTemplete);
router.route('/get-user-templete/:userId').get(verifyJWT,getTempletesByUser);
router.route('/get-templete/:tempId?').get(verifyJWT,getTemplets);

//mobile user route

router.route('/get-mobileuser-templete').get(verifyJWTUser,authAllUserRole,getTempletesByMobileUSer);


export default router;

