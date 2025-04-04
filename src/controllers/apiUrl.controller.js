import { ApiUrl } from '../models/apiurl.model.js';
import { asyncHandler } from '../utils/AsyncHandler.js'
import { APIResponse } from '../utils/APIResponse.js'

// Get URLs (only one record)
 const getApiUrls = asyncHandler(async (req, res) => {  
    const url = await ApiUrl.findOne();
    if (!url) {
        return res.status(404).json(new APIResponse(404, {}, 'No API URL found'));
    }
    res.status(200).json(new APIResponse(200, url, 'URL fetched successfully'));
});

// Add or Update URLs (only one record)
 const upsertApiUrls = asyncHandler(async (req, res) => {
    const { whatsappApiUrl, smsApiUrl } = req.body;

    if (!whatsappApiUrl || !smsApiUrl) {
        return res.status(400).json(new APIResponse(400, {}, 'Both URLs are required'));
    }

    const updatedUrl = await ApiUrl.findOneAndUpdate(
        {},
        { whatsappApiUrl, smsApiUrl },
        { upsert: true, new: true }
    );

    res.status(200).json(new APIResponse(200, updatedUrl, 'URL added/updated successfully'));
});


// Delete URLs (if needed)
 const deleteApiUrls = asyncHandler(async (req, res) => {
    const deletedUrl = await ApiUrl.deleteOne();
    if(!deletedUrl){
        return res.status(404).json(new APIResponse(404,{},'API Url Not Found'))
    }
    res.status(200).json(new APIResponse(200, {}, 'URL deleted successfully'));
});

export {
    getApiUrls,
    upsertApiUrls,
    deleteApiUrls
}


