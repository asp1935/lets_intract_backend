import { Router } from "express";
import {
    currentUser,
    deleteUserAdmin,
    getAdminUsers,
    getAllAdminUser,
    getUser,
    loginAdmin,
    logoutAdmin,
    registerAdminUser,
    registerSuperAdmin,
    updatePassword,
    updateAdmin
} from "../controllers/admin.controller.js";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Test route to check if the Admin route is working properly
router.get('/', (req, res) => {
    return res.json({ statusCode: 200, message: 'Admin Route Working Fine...' });
});

// Route for registering the Super Admin (no authentication required)
router.route('/register-superadmin').post(registerSuperAdmin);

// Route for creating an Admin User (accessible only to authenticated Super Admins)
router.route('/create-useradmin').post(verifyJWT, authAdmin, registerAdminUser);

// Route for Admin login (returns access and refresh tokens)
router.route('/login-admin').post(loginAdmin);

// Route for Admin logout (requires authentication)
router.route('/logout-admin').get(verifyJWT, logoutAdmin);

// Route to update permissions of an Admin User by ID (only accessible to  Admins)
router.route('/update-admin/:id').patch(verifyJWT, authAdmin, updateAdmin);

// Route to delete an Admin User by ID (only accessible to  Admins)
router.route('/delete-admin/:id').delete(verifyJWT, authAdmin, deleteUserAdmin);

// Route to get a list of all Admin Users (only accessible to  Admins)
router.route('/get-users').get(verifyJWT, authAdmin, getAllAdminUser);

// Route to get the currently authenticated Admin User's details
router.route('/current-user').get(verifyJWT, currentUser);

// Route to update password (only accessible to  Admins)
router.route('/current-user').get(verifyJWT, authAdmin,updatePassword);

router.route('/get-user/:id?').get(verifyJWT,authAdmin,getUser);
router.route('/get-admin-user/:id?').get(verifyJWT,authAdmin,getAdminUsers);


export default router;
