import { isValidObjectId } from "mongoose";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { WhatsappTemplete } from "../models/whatsappTemplete.model.js";
import fs from 'fs';


const addWhatsappTemplete = asyncHandler(async (req, res) => {
    const { userId, templeteName, message } = req.body;
    
    const imgFilePath = req.file?.path || null;
    
    let imageBase64 = null;

    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }
    if (!message || message.trim() === '') {
        return res.status(400).json(new APIResponse(400, {}, 'Message is Required'))
    }

    // Convert image to base64
    if (imgFilePath) {
        const imageBuffer = fs.readFileSync(imgFilePath);
        imageBase64 = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
        fs.unlinkSync(req.file.path);  // Clean up temp file
    }

    if ([userId, templeteName, message].some(field => field?.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, "All fields are required"));
    }

    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }
    try {
        const newTemplete = await WhatsappTemplete.create({ userId, templeteName, message, whatsappImg: imageBase64 });
        return res.status(201).json(new APIResponse(201, newTemplete, "Whatsapp Template added successfully"));
    } catch (error) {
        if (error.code === 11000) {
            // MongoDB duplicate key error (11000)
            return res.status(400).json(new APIResponse(400, {}, "Template name must be unique"));
        }
        return res.status(500).json(new APIResponse(500, {}, "Internal server error"));
    }
});

const updateWhatsappTemplete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { templeteName, message } = req.body;

    if ([id, templeteName, message].some(field => field.trim() === '')) {
        return res.status(400).json(new APIResponse(400, {}, "All fields are required"));
    }
    if (!isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
    }

    try {
        const updatedTemplete = await WhatsappTemplete.findByIdAndUpdate(
            id,
            { templeteName, message },
            { new: true, runValidators: true }
        );
        if (!updatedTemplete) {
            return res.status(404).json(new APIResponse(404, {}, "Template not found"));
        }
        return res.status(200).json(new APIResponse(200, updatedTemplete, "Whatsapp Template updated successfully"));
    } catch (error) {
        if (error.code === 11000) {
            // MongoDB duplicate key error (11000)
            return res.status(400).json(new APIResponse(400, {}, "Template name must be unique"));
        }
        return res.status(500).json(new APIResponse(500, {}, "Internal server error"));
    }
});

const deleteWhatsappTemplete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id.trim() === '' || !isValidObjectId(id)) {
        return res.status(400).json(new APIResponse(400, {}, 'Required / Invalid Templete ID'))
    }

    const deletedTemplete = await WhatsappTemplete.findByIdAndDelete(id);

    if (!deletedTemplete) {
        return res.status(404).json(new APIResponse(404, {}, "Template Already Deleted"));
    }

    return res.status(200).json(new APIResponse(200, {}, "Whatsapp Template deleted successfully"));
});

const getTempletesByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Inavlid User ID'))
    }

    const userTempletes = await SmsTemplete.find({ userId }).populate('userId', 'name');

    if (!userTempletes) {
        return res.status(200).json(200, {}, 'No Templetes available');
    }
    return res.status(200).json(new APIResponse(200, userTempletes, 'All USer Templetes Fetched'))
})

const getTemplets = asyncHandler(async (req, res) => {
    const tempId = req.params?.tempId;
    if (tempId && !isValidObjectId(tempId)) {
        return res.status(400).json(new APIResponse(400, {}, 'Invalid Templete ID'))
    }
    // Construct where condition properly
    const wherecondition = tempId ? { _id: tempId } : {};


    const templetes = await WhatsappTemplete.find(wherecondition).populate('userId', 'name');
    if (!templetes) {
        return res.status(404).json(new APIResponse(404, {}, 'Templetes not Available'))
    }
    return res.status(200).json(new APIResponse(200, templetes, 'Templete Fetched Successfully'));
})

const getTempletesByMobileUSer = asyncHandler(async (req, res) => {
    const userId = req.user?.role === 'user' ? req.user._id : req.user?.role === 'member' ? req.user.userId : null;



    const userTempletes = await WhatsappTemplete.find({ userId });

    if (!userTempletes) {
        return res.status(200).json(200, {}, 'No Templetes available');
    }
    return res.status(200).json(new APIResponse(200, userTempletes, 'All USer Templetes Fetched'))
})




export {
    addWhatsappTemplete,
    updateWhatsappTemplete,
    deleteWhatsappTemplete,
    getTempletesByUser,
    getTemplets,
    getTempletesByMobileUSer
}