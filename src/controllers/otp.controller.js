import { Otp } from "../models/otp.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import crypto from 'crypto';

// Generate Random OTP (4 )
const generateOtp = () => crypto.randomInt(1000, 9999).toString();

const sendOpt = asyncHandler(async (req, res) => {
    const { mobile } = req.body;
    
    if (!/^[0-9]{10}$/.test(mobile)) return res.status(400).json(new APIResponse(400, {}, "Invalid mobile number."));

    try {
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Upsert OTP (create if not exists, update if exists)
        await Otp.findOneAndUpdate(
            { mobile },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        // Simulate sending OTP (Replace with actual SMS logic)
        console.log(`OTP for ${mobile} is: ${otp}`);

        res.status(200).json(new APIResponse(200,{},"OTP sent successfully." ));
    } catch (error) {
        res.status(500).json(new APIResponse(500,{},"Error sending OTP.", error ));
    }
});


export {
    sendOpt
}