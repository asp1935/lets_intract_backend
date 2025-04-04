//this middleware for handling error thrown by asynchhandler

import { APIResponse } from '../utils/APIResponse.js';

export const errorMiddleware = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`); // Logs the error to the console

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json(new APIResponse(statusCode, {}, message));
};

