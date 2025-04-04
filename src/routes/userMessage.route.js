import { Router } from "express";
import { APIResponse } from "../utils/APIResponse.js";
import { authAllUserRole, authUser, verifyJWTUser } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { deleteUserMessage, getUserMessage, upsertMessage } from "../controllers/userMessage.controller.js";

const router=Router();

router.get('/',(req,res)=>{
    return res.status(200).json(new APIResponse(200,{},"User Message Route Working"));
})

router.route('/upsert-message').post(verifyJWTUser,authUser,upload.single('whatsappImage'),upsertMessage);
router.route('/get-message').get(verifyJWTUser,authAllUserRole,getUserMessage);
router.route('/delete-message').delete(verifyJWTUser,authUser,deleteUserMessage);

// router.route('/get-message-member').get(verifyJWTMember,getUserMessageMember);




export default router;

