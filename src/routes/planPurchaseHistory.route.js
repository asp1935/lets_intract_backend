import { Router } from "express";
import { verifyJWT } from '../middleware/auth.middleware.js';
import { getAllPurchaseHistory, getReport } from "../controllers/planPurchaseHistory.controller.js";

const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "Purchase Histroy  Route Working" });
});

router.route('/get-purchase').get(verifyJWT, getAllPurchaseHistory);
router.route('/get-monthly-report').get(verifyJWT, getReport);


export default router;

