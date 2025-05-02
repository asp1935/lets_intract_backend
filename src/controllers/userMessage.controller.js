import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import fs from 'fs';
import { UserMessage } from "../models/userMessage.model.js";

const upsertMessage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { message } = req.body || null;
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

    // Build the update object dynamically
    const updateObj = { message };
    if (imageBase64) {
        updateObj.whatsappImg = imageBase64;
    }
    
    
    const userMessage = await UserMessage.findOneAndUpdate(
        { userId },
        {
            $set: updateObj
        },
        { new: true, upsert: true }
    )
    return res.status(200).json(new APIResponse(200, userMessage, userMessage?._id ? 'User Message updated successfully' : 'User Message created successfully'));

});

const getUserMessage = asyncHandler(async (req, res) => {
    // const userId=req.user?._id;
    const userId = req.user?.role === 'user' ? req.user._id : req.user?.role === 'member' ? req.user.userId : null;

    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid User ID"))
    }
    const userMessage = await UserMessage.find({ userId });

    if (!userMessage) {
        return res.status(404).json(new APIResponse(404, {}, "No User Message Found"));
    }
    return res.status(200).json(new APIResponse(200, userMessage, "User Message Fetched Successfully"));
})

// const getUserMessageMember=asyncHandler(async(req,res)=>{
//     const userId=req.member.userId;

//     if(!userId || !isValidObjectId(userId)){
//         return res.status(400).json(new APIResponse(400,{},"Invalid User ID"))
//     }
//     const userMessage=await UserMessage.find({userId});

//     if(!userMessage){
//         return res.status(404).json(new APIResponse(404,{},"No User Message Found"));
//     }
//     return res.status(200).json(new APIResponse(200,userMessage,"User Message Fetched Successfully"));
// });

const deleteUserMessage = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json(new APIResponse(400, {}, "Invalid User ID"))
    }
    const deletedUserMessage = await UserMessage.findOneAndDelete({ userId });
    if (!deletedUserMessage) {
        return res.status(404).json(new APIResponse(404, {}, "Message Already Deleted"))
    }
    return res.status(200).json(new APIResponse(200, deletedUserMessage, "Message Deleted Successfully"));
})


export {
    upsertMessage,
    getUserMessage,
    // getUserMessageMember,
    deleteUserMessage
}
