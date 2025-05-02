import { Router } from 'express';
import { authAdmin, authorize, verifyJWT } from '../middleware/auth.middleware.js';
import { addAsscociate, deletedAssociate, getAllAssociateReferralCount, getAssociateReferralUsers, getAssociates, updateAllAssoCommission, updateAssociate, updateCommission, updateReferralCountZero } from '../controllers/associate.controller.js';
const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "Associate Route Working" });
})

router.route('/add-associate').post(verifyJWT, authorize(['associate']), addAsscociate);  //new associate
router.route('/update-associate/:id').patch(verifyJWT, authorize(['associate']), updateAssociate);    //update associate details
router.route('/delete-associate/:id').delete(verifyJWT, authorize(['associate']), deletedAssociate);  //delete associate
router.route('/get-associate/:id?').get(verifyJWT, authorize(['politician', 'business', 'associate']), getAssociates);  //get all or single assoicate details
router.route('/update-commission').patch(verifyJWT, authAdmin, updateAllAssoCommission);  //update all assoicate Commisson
router.route('/update-commission/:id').patch(verifyJWT, authAdmin, updateCommission); //update specific associate commission
router.route('/update-referral-zero/:id').patch(verifyJWT, authAdmin, updateReferralCountZero);   //set temp referral zero
router.route('/get-referral-count').get(verifyJWT, getAllAssociateReferralCount);    //get associate referral count
router.route('/get-refferal-details').get(verifyJWT, getAssociateReferralUsers)  //get referral details


export default router;
