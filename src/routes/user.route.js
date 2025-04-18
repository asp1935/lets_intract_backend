import { Router } from "express";
// import { body } from "express-validator";
import { authAdmin, authAllUserRole, authorize, authUser, verifyJWT, verifyJWTUser } from "../middleware/auth.middleware.js";
import { addBulkMembers, addSingleMember, deleteUser, deleteUserAllMember, deleteUserKey, getCurrentMobileUser, getUser, getUserMembers, loginMobileUser, logoutMobileUser, registerUser, setVerifyUserKey, updateVerification, updateMember, updatePassword, updateUser, getMobileUserMembers, getUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyLimiter } from "../middleware/otp.middleware.js";

const router = Router();

// const validatePlan = [
//     body("name").trim().notEmpty().withMessage("User name is required"),
//     body("email").notEmpty().withMessage("Email is required").trim().isEmail().withMessage("Invalid Email Address"),
//     body("mobile").notEmpty().withMessage("Mobile No is required").isMobilePhone("en-IN").withMessage("Invalid Mobile Number"),
//     body("address").notEmpty().withMessage("Address is Requried"),
//     body("type").notEmpty().withMessage("User Type is required").toLowerCase().isIn(["business", "politician"]).withMessage("User Type must be either 'business' or 'politician'"),
//     // body("password").notEmpty().withMessage("Password is Required"),
// ];


router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: 'User Route Working' });
})

router.route('/register-user').post(verifyJWT,authorize(['politician','business']) ,verifyLimiter, registerUser);
router.route('/update-user/:id').patch(verifyJWT,authorize(['politician','business']), updateUser);
router.route('/get-user-members/:userId').get(verifyJWT,authorize(['politician','business']), getUserMembers);
router.route('/get-user-details/:id?').get(verifyJWT, authorize(['politician','business']), getUserDetails);


router.route('/add-bulk-member').post(verifyJWT,authorize(['politician','business']), upload.single('memberList'), addBulkMembers)
router.route('/add-member/:userId').post(verifyJWT,authorize(['politician','business']), addSingleMember);
router.route('/update-member/:id').patch(verifyJWT,authorize(['politician','business']), updateMember);
router.route('/delete-user-members/:userId').delete(verifyJWT,authorize(['politician','business']), deleteUserAllMember);


router.route('/update-password/:id').patch(verifyJWT,authorize(['politician','business']), updatePassword);
router.route('/delete-user/:id').delete(verifyJWT,authorize(['politician','business']), deleteUser);
// router.route('/get-user').get(verifyJWT,getAllUsers);
// router.route('/get-single-usermember/:id?').get(verifyJWT,getSingleUser);
// router.route('/get-members').get(verifyJWT,authUser,getAllMembers);
router.route('/get-user/:id?').get(verifyJWT,authorize(['politician','business']), getUser);

router.route('/update-verification/:id').patch(verifyJWT,authorize(['politician','business']), updateVerification);  //for user activation
router.route('/delete-userkey/:id').patch(verifyJWT,authorize(['politician','business']), deleteUserKey);           //deleting user key and updating status

//app user routes
router.route('/register-mobile-user').post(registerUser);
router.route('/login-mobile-user').post(loginMobileUser);
router.route('/logout-mobile-user').get(verifyJWTUser, authAllUserRole, logoutMobileUser);
router.route('/current-mobile-user').get(verifyJWTUser, authAllUserRole, getCurrentMobileUser);
router.route('/setverify-userkey').patch(verifyJWTUser, authAllUserRole, setVerifyUserKey);
router.route('/get-mobileuser-members').get(verifyJWTUser, authUser, getMobileUserMembers);



export default router; 