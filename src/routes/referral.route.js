import { Router } from "express";
import { addReferral, deleteReferral, updateReferral } from "../controllers/referral.controller.js";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";
import { addStaffReferral, deleteStaffReferral, getStaff, getStaffReferCnt, getStaffReferralUsers, updateAllStaffIncentive, updateIncentive, updateStaffReferral } from "../controllers/staffReferral.controller.js";

const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "Referral Router Working" })
})

//for associate
router.route('/add').post(verifyJWT, addReferral);
router.route('/update/:id').patch(verifyJWT, updateReferral);
router.route('/delete/:id').delete(verifyJWT, deleteReferral);

//for staff
router.route('/add-staff').post(verifyJWT, addStaffReferral);
router.route('/update-staff/:id').patch(verifyJWT, updateStaffReferral)
router.route('/delete-staff/:id').delete(verifyJWT, deleteStaffReferral);
router.route('/get-refferal-details').get(verifyJWT, getStaffReferralUsers);
router.route('/get-staff-details/:id?').get(verifyJWT, getStaff);
router.route('/update-incentive/:id').patch(verifyJWT, authAdmin, updateIncentive);
router.route('/update-incentive/').patch(verifyJWT, authAdmin, updateAllStaffIncentive);
router.route('/get-referral-count').get(verifyJWT, getStaffReferCnt);

export default router;