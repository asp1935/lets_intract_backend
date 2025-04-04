import rateLimit from 'express-rate-limit';
import { APIResponse } from '../utils/APIResponse.js';

// Rate limiter for OTP requests (Limit: 3 requests per 10 minutes per mobile)
export const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each mobile/IP to 3 requests per windowMs
    keyGenerator: (req) => req.body.mobile, // Rate limit per mobile number
    handler: (req, res) => res.status(429).json(new APIResponse(429, {}, "Too many OTP requests. Try again later.")),
});

// Rate limiter for OTP verification (Limit: 5 attempts per 10 minutes)
export const verifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => `${req.body.mobile}-verify`, // Separate limit for verification
    handler: (req, res) => res.status(429).json(new APIResponse(429, {}, "Too many verification attempts. Try again later.")),
});
