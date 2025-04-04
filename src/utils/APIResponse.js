// Class to structure API responses
class APIResponse {
    /**
     * Constructor to create an API response object.
     * @param {number} statusCode - HTTP status code for the response.
     * @param {any} data - Data to be sent in the response body.
     * @param {string} [message='success'] - Optional message, defaults to 'success'.
     */
    constructor(statusCode, data, message = 'success') {
        this.statusCode = statusCode; // HTTP status code
        this.data = data; // Response data
        this.message = message; // Response message
        this.success = statusCode < 400; // Boolean indicating success (status codes < 400)
    }
}

export { APIResponse };
