import { Templete } from "../models/templetes.model.js";
import { APIResponse } from "../utils/APIResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { TEMPLETE_NAMES } from "../utils/Constant.js";


const upsertTemplete = asyncHandler(async (req, res) => {
    try {
        const { templeteName, templete } = req.body;
        if ([templeteName, templete].some(field => !field || typeof field !== "string" || field.trim() === "")) {
            return res.status(400).json(new APIResponse(400, {}, 'All Fields are Required'));
        }
        if (!TEMPLETE_NAMES.includes(templeteName.trim())) {
            return res.status(400).json(new APIResponse(400, {}, 'Invalid Templete Name'))
        }

        const updatedTemplete = await Templete.findOneAndUpdate(
            { templeteName: templeteName.trim() },
            { $set: { templete: templete.trim() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        if (!updatedTemplete) {
            return res.status(500).json(new APIResponse(500, {}, "Something went wrong while updating Templete"))
        }
        return res.status(200).json(new APIResponse(200, updatedTemplete, "Template added or updated successfully"))

    } catch (error) {
        console.log('Error', error);
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"))
    }
});


const getTemplete = asyncHandler(async (req, res) => {
    try {
        const { templeteName } = req.query

        if (templeteName) {
            if (typeof templeteName !== "string" || templeteName.trim() === "") {
                return res.status(400).json(new APIResponse(400, {}, "Template name must be a non-empty string"));
            }

            if (!TEMPLETE_NAMES.includes(templeteName.trim())) {
                return res.status(400).json(new APIResponse(400, {}, "Invalid template name"));
            }

            const template = await Templete.findOne({ templeteName: templeteName.trim() });

            if (!template) {
                return res.status(200).json(new APIResponse(200, {}, "Template not found"));
            }

            return res.status(200).json(new APIResponse(200, template, "Template fetched successfully"));
        }

        // If no templeteName provided, return all
        const allTemplates = await Templete.find({});
        if (!allTemplates || allTemplates.length === 0) {
            return res.status(200).json(new APIResponse(200, {}, "Template not found"));
        }
        return res.status(200).json(new APIResponse(200, allTemplates, "All templates fetched successfully"));

    } catch (error) {
        return res.status(200).json(new APIResponse(200, {}, "Internal Server Error"))
    }
})

export {
    upsertTemplete,
    getTemplete
}