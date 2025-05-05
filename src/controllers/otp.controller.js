import { Enquiry } from "../models/enquiry.model.js";
import { Otp } from "../models/otp.model.js";
import { SmsApi } from "../models/smsApi.model.js";
import { Templete } from "../models/templetes.model.js";
import { User } from "../models/user.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import crypto from 'crypto';
import axios from 'axios'

// Generate Random OTP (4 )
const generateOtp = () => crypto.randomInt(1000, 9999).toString();

const sendOpt = asyncHandler(async (req, res) => {
    const { mobile } = req.body;

    if (!/^[0-9]{10}$/.test(mobile)) return res.status(400).json(new APIResponse(400, {}, "Invalid mobile number."));

    const userCheck = await User.findOne({ mobile: String(mobile) })

    if (userCheck) {
        return res.status(409).json(new APIResponse(409, {}, 'Mobile No Already Exist'))
    }
    const enquiryCheck = await Enquiry.findOne({ mobile: String(mobile) })

    if (enquiryCheck) {
        return res.status(409).json(new APIResponse(409, {}, 'Mobile No Already Exist, Support Team Connect With You Shortly'))
    }

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

        if (process.env.OTP_SMS === 'true') {
            try {
                const api = await SmsApi.findOne().select("apiUrl apiKey senderId channel dcs");
                const templeteData = await Templete.findOne({ templeteName: 'otp' });

                if (api && templeteData) {

                    const message = templeteData.templete.replace("${otp}", otp);
                    const params = new URLSearchParams({
                        apiKey: api.apiKey,
                        senderid: api.senderId,
                        channel: api.channel,
                        DCS: api.dcs,
                        flashsms: "0",
                        number: mobile,
                        text: message

                    });

                    const fullUrl = `${api.apiUrl}?${params.toString()}`;

                    const response = await axios.get(fullUrl);
                    console.log(response.status);

                } else {
                    console.log("API or Template not found, skipping SMS");
                }
            } catch (error) {
                console.log("Error sending SMS:", error.message);
            }
        }
        return res.status(200).json(new APIResponse(200, { otp }, "OTP sent successfully."));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Error sending OTP.", error));
    }
});


export {
    sendOpt
}