import { Router } from "express";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";
import { getSMSAPI, upsertSMSAPI } from "../controllers/smsApi.controller.js";

const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "SMS API route Working fine" })
})

router.route('/upsert-smsapi').post(verifyJWT, authAdmin, upsertSMSAPI);
router.route('/get-smsapi').get(verifyJWT, authAdmin, getSMSAPI);

export default router;