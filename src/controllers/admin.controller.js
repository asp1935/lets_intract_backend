import { isValidObjectId } from "mongoose";
import { Admin } from "../models/admin.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { USER_PERMISSIONS } from "../utils/Constant.js";



//this method for genrating refresh token and access token
const genrateAccessAndRefreshToken = async (adminId) => {
    try {
        //find user 

        const admin = await Admin.findById(adminId);

        //genrate tokens
        const accessToken = admin.genrateAccessToken();
        const refreshToken = admin.genrateRefreshToken();

        //store tokens to db 
        admin.refreshToken = refreshToken;
        //save method update db and validateBeforeSave:false is given because we are updating only single value thats why it calls mongoose moduls like require like 
        //so we give validateBeforeSave:false it save/update  data without validation  
        await admin.save({ validateBeforeSave: false })
        return { refreshToken, accessToken }

    } catch (error) {
        const errors = new Error('Something Went Wrong While Genrating Tokens')
        errors.statusCode = 401;
        throw errors
    }
};

//for new superadmin registration

const registerSuperAdmin = asyncHandler(async (req, res) => {
    //field get from body
    const { name, email, password, key } = req.body;

    //validation
    if ([name, email, password, key].some(field => field?.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required!!!'));
    }
    if (key !== 'Sms@123') {
        return res
            .status(401)
            .json(new APIResponse(400, {}, 'Key is Wrong!!!'));
    }

    //check email already exist
    const existedAdmin = await Admin.exists({ email });
    if (existedAdmin) {
        return res.status(409).json(new APIResponse(409, {}, 'Super Admin Already Exist!!!'));
    }
    //store into db
    const admin = await Admin.create({
        name,
        email,
        role: 'superadmin',
        password,
    });

    //get created admin details
    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken")
    if (!createdAdmin) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while Creating Admin'))
    }
    return res.status(201).json(new APIResponse(200, createdAdmin, "Admin Registered Successfully")
    )
})

// Create Admin or User
const registerAdminUser = asyncHandler(async (req, res) => {
    //field get from body
    const { name, email, role, permissions, password } = req.body;
    const loggedUserRole = req?.user?.role;

    //validation
    if ([name, email, role, password].some(field => field?.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required!!!'));
    }
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Role'))
    }
    // Validate permissions field
    if (!Array.isArray(permissions)) {
        return res
            .status(400)
            .json(new APIResponse(400, {}, 'Invalid format for permissions field!'));
    }
    // if (!permissions.every((perm) => USER_PERMISSIONS.includes(perm))) {
    //     return res
    //         .status(400)
    //         .json(new APIResponse(400, {}, 'Invalid permissions provided.'));
    // }
    const invalidPermissions = permissions.filter((perm) => !USER_PERMISSIONS.includes(perm));

    if (invalidPermissions.length > 0) {
        console.log(invalidPermissions);

        return res
            .status(400)
            .json(new APIResponse(400, { invalidPermissions }, 'Invalid permissions provided.'));
    }


    // Restrict role creation based on logged-in user's role
    if (loggedUserRole === 'admin' && role !== 'user') {
        return res
            .status(403)
            .json(new APIResponse(403, {}, 'Invalid User Role!!!'));
    }
    if (loggedUserRole === 'superadmin' && !['user', 'admin'].includes(role)) {
        return res
            .status(403)
            .json(new APIResponse(403, {}, 'Invalid Role!!!'));
    }
    //check email already exist
    const existedAdmin = await Admin.exists({ email });
    if (existedAdmin) {
        return res.status(409).json(new APIResponse(409, {}, 'Admin Already Exist!!!'));
    }
    //store into db
    const admin = await Admin.create({
        name,
        email,
        role,
        permissions,
        password,
    });

    //get created admin details
    const createdAdmin = await Admin.findById(admin._id).select("-password -refreshToken")
    if (!createdAdmin) {
        return res.status(500).json(new APIResponse(500, {}, 'Something went wrong while Creating Admin'))
    }
    return res.status(201).json(new APIResponse(200, createdAdmin, `${role === 'admin' ? 'Admin' : 'User'} Registered Successfully`)
    )
});

// login Admin
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for missing fields
    if (!email || !password) {
        return res.status(400).json(new APIResponse(400, {}, 'Email & Password Are Required!'));
    }

    // Find the admin and exclude refreshToken from the initial query
    const admin = await Admin.findOne({ email }).select('-refreshToken');

    if (!admin) {
        return res.status(404).json(new APIResponse(404, {}, 'Account Not Found Check Credentails!'));
    }

    // Validate password
    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(401).json(new APIResponse(401, {}, 'Invalid Password!'));
    }

    // Generate tokens
    const { refreshToken, accessToken } = await genrateAccessAndRefreshToken(admin._id);

    const isProd = process.env.NODE_ENV === 'production';
    // Cookie options
    const options = {
        httpOnly: true,
        secure: isProd, // Enable secure cookies in production
        sameSite: isProd ? 'None' : 'Lax', // Prevent CSRF attacks(strict opyion   ) 
    };

    // Set cookies with appropriate expiration times
    res
        .cookie("accessToken", accessToken, { ...options, maxAge: 24 * 60 * 60 * 1000 }) // 1 day
        .cookie('refreshToken', refreshToken, { ...options, maxAge: 10 * 24 * 60 * 60 * 1000 }) // 10 days
        .status(200)
        .json(new APIResponse(200, { user: admin }, "User Logged In Successfully!"));
});


//Logout Admin
const logoutAdmin = asyncHandler(async (req, res) => {
    // Check if admin exists in the request
    if (!req.admin || !req.admin._id) {
        return res.status(401).json(new APIResponse(401, {}, "Unauthorized - Admin Not Found"));
    }

    // Remove refreshToken from DB
    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $unset: { refreshToken: 1 }, // Remove refreshToken field from document
        },
        { new: true }
    );

    const isProd = process.env.NODE_ENV === 'production';

    // Cookie options
    const options = {
        httpOnly: true,
        secure: isProd, // Enable secure cookies in production
        sameSite: isProd ? 'None' : 'Lax', // Prevent CSRF attacks(strict opyion   ) 
    };

    // Clear tokens and send response
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new APIResponse(200, {}, "Admin Logged Out Successfully!"));
});


//Update Permission
const updateAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, role, permissions } = req.body;

    // Validate ID
    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid ID"));
    }

    // Validate permissions
    if (!Array.isArray(permissions)) {
        return res.status(400).json(new APIResponse(400, {}, 'Permissions must be an array!'));
    }
    if (permissions.length === 0) {
        return res.status(400).json(new APIResponse(400, {}, 'Permissions cannot be empty!'));
    }

    // Update permissions
    const updatedAdmin = await Admin.findByIdAndUpdate(
        id,
        { name, email, role, permissions },
        { new: true, runValidators: true }
    );

    if (!updatedAdmin) {
        return res.status(404).json(new APIResponse(404, {}, 'User Not Found!'));
    }

    return res.status(200).json(new APIResponse(200, updatedAdmin, 'Permissions Updated Successfully.'));
});


// Delete User & Admin
const deleteUserAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const loggedUserRole = req.admin?.role;

    // Validate ID
    if (!id || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid ID"));
    }

    // Check if the user exists
    const userToDelete = await Admin.findById(id);
    if (!userToDelete) {
        return res.status(404).json(new APIResponse(404, {}, "User Already Deleted"));
    }

    // Authorization checks
    if (loggedUserRole === 'admin') {
        // Admin can delete only users
        if (userToDelete.role !== 'user') {
            return res.status(403).json(new APIResponse(403, {}, 'Admins can only delete users.'));
        }
    } else if (loggedUserRole === 'superadmin') {
        // Superadmin can delete both users and admins
        if (!['user', 'admin'].includes(userToDelete.role)) {
            return res.status(403).json(new APIResponse(403, {}, 'Superadmin can only delete users or admins.'));
        }
    } else {
        // Unauthorized roles
        return res.status(403).json(new APIResponse(403, {}, 'You are not authorized to perform this action.'));
    }

    // Perform deletion
    const { deletedCount } = await Admin.deleteOne({ _id: id });
    if (deletedCount === 0) {
        return res.status(500).json(new APIResponse(500, {}, "Something Went Wrong while Deleting User"));
    }

    // Successful deletion response
    return res.status(200).json(new APIResponse(200, {}, "User Deleted Successfully"));
});


// Fetch Current Logged-in Admin 
const currentUser = asyncHandler(async (req, res) => {
    // Respond with the current logged-in admin's details (added by verifyJWT middleware)
    return res
        .status(200)
        .json(new APIResponse(200, req.admin, "Current User Fetched"));
});


// Fetch All Admin Users 
const getAllAdminUser = asyncHandler(async (req, res) => {
    // Get the role of the logged-in admin
    const loggedUserRole = req.admin?.role;
    let users;

    // Check role and fetch users accordingly
    if (loggedUserRole === 'admin') {
        // Admin can only see 'user' roles
        users = await Admin.find({ role: 'user' });
    } else if (loggedUserRole === 'superadmin') {
        // Superadmin can see both 'user' and 'admin' roles
        users = await Admin.find({
            role: {
                $in: ['user', 'admin']
            }
        });
    } else {
        // Unauthorized Access
        return res
            .status(403)
            .json(new APIResponse(403, {}, 'Unauthorized Access!!!'));
    }

    // Check if users were found
    if (!users || users.length === 0) {
        return res
            .status(200)
            .json(new APIResponse(200, {}, "No User Found"));
    }

    // Respond with the list of users
    return res
        .status(200)
        .json(new APIResponse(200, users, 'All Users Fetched'));
});


// Update Admin Password 
const updatePassword = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { newPassword } = req.body;

    // Validate Admin ID
    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Admin ID'));
    }

    // Check if new password is provided
    if (newPassword.trim() === '') {
        return res.status(400).json(new APIResponse(400, {}, 'New Password is Required'));
    }

    // Find Admin by ID
    const admin = await Admin.findById(id);
    if (!admin) {
        return res.status(404).json(new APIResponse(404, {}, 'Admin Not Found'));
    }

    // Update password
    admin.password = newPassword;

    // Saving the updated admin triggers the 'pre' middleware in user.model
    await admin.save({ validateBeforeSave: false });

    // Respond with success message
    return res
        .status(200)
        .json(new APIResponse(200, {}, "Password Changed Successfully..."));
});

// Fetch All  Users 
const getUser = asyncHandler(async (req, res) => {
    // Extract id and logged-in user's role
    const { id } = req.params;
    const loggedUserRole = req.admin?.role;

    // Check role and permissions
    if (loggedUserRole !== 'admin' && loggedUserRole !== 'superadmin') {
        return res
            .status(403)
            .json(new APIResponse(403, {}, 'Unauthorized Access!!!'));
    }

    // Define query condition for fetching users
    const whereCondition = id ? { _id: id, role: 'user' } : { role: 'user' };

    // Fetch users
    const users = await Admin.find(whereCondition);

    // Handle no users found
    if (!users || users.length === 0) {
        return res
            .status(404)
            .json(new APIResponse(404, {}, 'No User Found'));
    }

    // Respond with the list of users
    return res
        .status(200)
        .json(new APIResponse(200, users, 'All Users Fetched'));
});

const getAdminUsers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { roleCategory } = req.query;  // Get roleCategory from query params
    const loggedUserRole = req.admin?.role;

    if (id && !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid ID"))
    }
    // Check permission: only 'admin' and 'superadmin' can access
    if (loggedUserRole !== 'admin' && loggedUserRole !== 'superadmin') {
        return res
            .status(403)
            .json(new APIResponse(403, {}, 'Unauthorized Access!!!'));
    }

    // Role conditions
    let rolesToFetch = [];

    if (roleCategory === 'user') {
        rolesToFetch = ['user'];
    } else if (!roleCategory) {
        // If roleCategory not passed, decide based on logged-in role
        rolesToFetch = loggedUserRole === 'admin' ? ['user'] : ['user', 'admin'];
    } else {
        return res
            .status(400)
            .json(new APIResponse(400, {}, 'Invalid roleCategory'));
    }

    // Query setup
    const query = { role: { $in: rolesToFetch } };
    if (id) query._id = id;

    // Fetch users from DB
    const users = await Admin.find(query);

    // Handle no users found
    if (!users || users.length === 0) {
        return res
            .status(404)
            .json(new APIResponse(404, {}, 'No User Found'));
    }

    // Respond with fetched users
    return res
        .status(200)
        .json(new APIResponse(200, users, 'Users Fetched Successfully'));
});






export {
    registerAdminUser,
    registerSuperAdmin,
    loginAdmin,
    logoutAdmin,
    updateAdmin,
    deleteUserAdmin,
    getAllAdminUser,
    currentUser,
    updatePassword,
    getUser,
    getAdminUsers
}