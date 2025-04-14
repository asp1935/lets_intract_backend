import { Admin } from "../models/admin.model.js";
// import { Member } from "../models/members.model.js";
import { User } from "../models/user.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from 'jsonwebtoken';

// Helper function for extracting token
const extractToken = (req) => {
    return req.cookies?.accessToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
};
// Helper function for error response
const handleError = (res, status, message) => {
    return res.status(status).json(new APIResponse(status, {}, message));
};

// Admin Verification Middleware
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        let token = extractToken(req);
        const refreshToken = req.cookies?.refreshToken;
        
        if (!token && !refreshToken) {
            return handleError(res, 401, "Unauthorized Request. Login Again");
        }

        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const admin = await Admin.findById(decodedToken._id).select('-password -refreshToken');
            

            if (!admin) {
                return handleError(res, 403, "Invalid or expired token");
            }

            req.admin = admin;
            return next();
        } else {
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const admin = await Admin.findById(decodedRefreshToken._id).select('-password -refreshToken');

                if (!admin) {
                    return handleError(res, 403, "Invalid refresh token");
                }

                const newAccessToken = jwt.sign(
                    { _id: admin._id },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
                );

                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict',
                });

                req.admin = admin;
                return next();
            } catch (refreshError) {
                return handleError(res, 403, "Invalid or expired refresh token");
            }
        }
    } catch (error) {
        return handleError(res, 500, "Internal Server Error");
    }
});

export const authorize = (requiredPermissions = []) => {
    
    return (req, res, next) => {
        
        const { role, permissions } = req.admin;
        console.log(permissions,requiredPermissions); 
        
        if (role === 'superadmin') {
            return next(); // Super admin has unrestricted access
        }

        if (role === 'admin') {
            if (requiredPermissions.includes('register')) {
                return handleError(res, 403, 'Access Denied!!!');
            }
            return next(); // Admin has all other access
        }

        if (role === 'user') {
            const hasPermissions = requiredPermissions.every((permission) =>
                permissions.includes(permission)
            );
            if (!hasPermissions) {
                return handleError(res, 403, 'Access Denied. Require Permission to Access!!!');
            }
            return next(); // User has the required permissions
        }

        // For any other role
        return handleError(res, 403, 'Access Denied. Unauthorized Role!!!');
    };
};


// Specific role-based middleware
export const authAdmin = (req, res, next) => {
    const { role } = req.admin;
    if (["superadmin", "admin"].includes(role)) {
        return next();
    }
    return handleError(res, 403, "Access Denied. Unauthorized User.");
};

export const authSuperAdmin = (req, res, next) => {
    const { role } = req.admin;
    if (role === "superadmin") {
        return next();
    }
    return handleError(res, 403, "Access Denied. Unauthorized User.");
};

// User Verification Middleware
export const verifyJWTUser = asyncHandler(async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return handleError(res, 401, "Unauthorized Request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_USER);
        const user = await User.findById(decodedToken._id).select('-password');

        if (!user) {
            return handleError(res, 403, "Invalid or expired token. Login Again");
        }

        req.user = user;
        next();
    } catch (error) {
        return handleError(res, 403, "Invalid or expired token");
    }
});

// Role-based Authorization Middlewares
export const authAllUserRole = (req, res, next) => {
    const { role } = req.user;
    if (["user", "member"].includes(role)) {
        return next();
    }
    return handleError(res, 403, "Access Denied. Unauthorized User.");
};

export const authUser = (req, res, next) => {
    const { role } = req.user;
    if (role === "user") {
        return next();
    }
    return handleError(res, 403, "Access Denied. Unauthorized User.");
};

export const authMember = (req, res, next) => {
    const { role } = req.user;
    if (role === "member") {
        return next();
    }
    return handleError(res, 403, "Access Denied. Unauthorized User.");
};

