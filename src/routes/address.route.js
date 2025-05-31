import { Router } from "express";
import { getAllStates, getDistrictByStateCode, getTalukasByDistrictCode } from "../controllers/address.controller.js";

const router=Router();

router.post('/getAllStates',getAllStates);
router.post('/getDistrictByStateCode',getDistrictByStateCode);
router.post('/getTalukasByDistrictCode', getTalukasByDistrictCode);


export default router; 