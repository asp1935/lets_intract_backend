import { asyncHandler } from "../utils/AsyncHandler.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load JSON
const states = require('../../public/data/states.json');
const districts = require('../../public/data/districts.json');
const talukas = require('../../public/data/subdistricts.json');

const getAllStates = asyncHandler(async (req, res) => {
    return res.json({ status: 200, data: states.data })
})

const getDistrictByStateCode = asyncHandler(async (req, res) => {
    const { statecode } = req.query;

    if (!statecode) {
        return res.status(400).json({ status: 400, message: "Invalid parameters" });
    }

    const result = districts[statecode];
    if (!result) {
        return res.status(204).json({ status: 204, message: "No content available", });
    }

    return res.json({
        status: 200,
        data: result
    });
});

// GET /api/getTalukasByDistrictCode?districtcode=466
const getTalukasByDistrictCode = asyncHandler(async (req, res) => {
    const { districtcode } = req.query;

    if (!districtcode) {
        return res.status(400).json({ status: 400, message: "Invalid parameters" });
    }

    const result = talukas[districtcode];
    if (!result) {
        return res.status(204).json({ status: 204, message: "No content available" });
    }

    return res.json({
        status: 200,
        data: result,
    });
});


export {
    getAllStates,
    getDistrictByStateCode,
    getTalukasByDistrictCode
}