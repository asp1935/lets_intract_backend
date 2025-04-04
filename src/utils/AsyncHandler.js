/**
 * Async Handler Utility:
 * - Simplifies the creation of asynchronous route handlers.
 * - Automatically catches errors and forwards them to the error-handling middleware.
 * - Eliminates the need for repetitive try-catch blocks in each route.
 *
 * @param {Function} requestHandler - Asynchronous route handler function.
 * @returns {Function} - Middleware function that handles errors.
 */

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        // Ensures the requestHandler resolves, and catches any errors, passing them to next()
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };
