// Import required modules
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Create an instance of express
const app = express();

/* 
 * CORS (Cross-Origin Resource Sharing) Middleware:
 * - Allows requests from specified origins.
 * - Useful when frontend and backend are hosted on different domains.
 */
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,  // Allowed origin from environment variables
//     credentials: true,  // Allow cookies and authentication headers across origins
// }));
const allowedOrigins = [
    process.env.CORS_ORIGIN,  // e.g., "https://yourwebsite.com"

];
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        res.status(403).json({ message: 'CORS Error: This origin is not allowed.' });
    } else {
        // Handle other types of errors
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

// Dynamic CORS Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);  // Allow if origin is in the list
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,  // Allow cookies and authorization headers
}));

/* 
 * Middleware to parse JSON data:
 * - Accepts JSON payloads and sets a size limit.
 * - Useful for handling requests with JSON bodies.
 */
app.use(express.json({ limit: '16kb' }));

/* 
 * Middleware to parse URL-encoded data:
 * - Parses incoming requests with URL-encoded payloads.
 * - extended: true -> Allows nested objects.
 */
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

/* 
 * Static File Serving:
 * - Serves static files from the 'public' directory.
 * - Useful for serving images, CSS, JS files, etc.
 */
app.use("/public", express.static("public"));

/* 
 * Cookie Parser Middleware:
 * - Parses cookies attached to the client request.
 * - Enables CRUD operations on cookies in the backend.
 */
app.use(cookieParser());

/* 
 * Test Route:
 * - Simple GET route to check server health.
 */
app.get('/', (req, res) => {
    return res.json({ statusCode: 200, message: 'Server is Working Fine' });
});

/* 
 * Importing Routers:
 * - Modularizes route handling by splitting it across different files.
 */
import adminRouter from './routes/admin.route.js';
import planRouter from './routes/plan.route.js';
import userRouter from './routes/user.route.js';
import userPlanRouter from './routes/userplan.route.js';
import whatsappAPIConfigRouter from './routes/whatsappAPIConfig.route.js';
import smsAPIConfigRouter from './routes/smsAPIConfig.route.js';
import smsTempleteRouter from './routes/smsTemplete.route.js';
import whatsappTempleteRouter from './routes/whatsappTemplete.route.js';
// import memberRouter from './routes/member.route.js';
import userMessageRouter from './routes/userMessage.route.js';
import apiUrlRouter from './routes/apiUrl.route.js';
import associateRouter from './routes/associate.route.js';
import referralRouter from './routes/referral.route.js';
import payoutRouter from './routes/payout.route.js';
import historyRouter from './routes/history.route.js';
import enquiryRouter from './routes/enquiry.route.js';
import otpRouter from './routes/otp.route.js';
import planPurchaseHistoryRouter from './routes/planPurchaseHistory.route.js';
import userPortfolioRouter from './routes/userPortfolio.route.js';
import templeteRouter from './routes/templete.route.js';
import smsApiRouter from './routes/smsApi.route.js';
import addressRouter from './routes/address.route.js';

/* 
 * Defining Routes:
 * - Mounts the imported routers under specific paths for modular route handling.
 */
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/plan', planRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/userplan', userPlanRouter);
app.use('/api/v1/whatsappconfig', whatsappAPIConfigRouter);
app.use('/api/v1/smsconfig', smsAPIConfigRouter);
app.use('/api/v1/smstemplete', smsTempleteRouter);
app.use('/api/v1/whatsapptemplete', whatsappTempleteRouter);
// app.use('/api/v1/member', memberRouter);
app.use('/api/v1/usermessage', userMessageRouter);
app.use('/api/v1/apiurl', apiUrlRouter);
app.use('/api/v1/associate', associateRouter);
app.use('/api/v1/referral', referralRouter);
app.use('/api/v1/payout', payoutRouter);
app.use('/api/v1/history', historyRouter);
app.use('/api/v1/enquiry', enquiryRouter);
app.use('/api/v1/otp', otpRouter);
app.use('/api/v1/planpurchase', planPurchaseHistoryRouter);
app.use('/api/v1/portfolio', userPortfolioRouter);
app.use('/api/v1/templete', templeteRouter);
app.use('/api/v1/smsapi', smsApiRouter);
app.use('/api/v1/address',addressRouter);


// Export the app instance for use in other modules
export { app };
