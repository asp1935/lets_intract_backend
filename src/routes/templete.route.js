import { Router } from "express";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";
import { getTemplete, upsertTemplete } from "../controllers/templete.controller.js";

const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "Templete Route Working Fine" });
});

router.route('/upsert-templete').post(verifyJWT, authAdmin, upsertTemplete);
router.route('/get-templete').get(verifyJWT,authAdmin,getTemplete);

export default router;

