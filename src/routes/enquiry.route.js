import { Router } from "express";
import { addEnquiry, deleteEnquiry, getAllEnquiries, updateEnquiry } from "../controllers/enquiry.controller.js";
import { authorize, verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "Enquiry Route Working" });
});

router.route('/add').post(addEnquiry);

router.route('/update/:id').patch(verifyJWT, authorize(['enquiry']), updateEnquiry);
router.route('/delete/:id').delete(verifyJWT, authorize(['enquiry']), deleteEnquiry);
router.route('/get/:id?').get(verifyJWT, authorize(['enquiry']), getAllEnquiries);

export default router;
