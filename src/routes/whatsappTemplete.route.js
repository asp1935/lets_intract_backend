import { Router } from "express";
import { authAllUserRole, verifyJWT, verifyJWTUser } from "../middleware/auth.middleware.js";
import { addWhatsappTemplete, deleteWhatsappTemplete, getTempletesByMobileUSer, getTempletesByUser, getTemplets, updateWhatsappTemplete } from "../controllers/whatsappTemplete.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router =Router();

router.get('/',(req,res)=>{
    return res.status(200).json({statusCode:200,mesage:'Sms Templete Route Working'})
})

router.route('/add-templete').post(verifyJWT,upload.single('whatsappImg'),addWhatsappTemplete);
router.route('/update-templete/:id').patch(verifyJWT,updateWhatsappTemplete);
router.route('/delete-templete/:id').delete(verifyJWT,deleteWhatsappTemplete);
router.route('/get-user-templete/:userId').get(verifyJWT,getTempletesByUser);
router.route('/get-templete/:tempId?').get(verifyJWT,getTemplets);

//mobile user route

router.route('/get-mobileuser-templete').get(verifyJWTUser,authAllUserRole,getTempletesByMobileUSer);


export default router;

