import { Router } from "express";
import { authAdmin, verifyJWT } from "../middleware/auth.middleware.js";
import { addPortfolioClient, addPortfolioGallery, addPortfolioServices, deletePortfolioItem, getPortfolio, getUserPortfolio, createUserPortfolio, updateUserPortfolio, deletePortfolio, updateUserProfile } from "../controllers/userPortfolio.controller.js";
import { portfolioUpload } from "../middleware/portfolioMulter.middleware.js";

const router = Router()

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "Portfolio Route Working" })
})

router.route('/create-portfolio').post(verifyJWT, portfolioUpload.single('profilePhoto'), createUserPortfolio);
router.route('/update-portfolio/:id').patch(verifyJWT, updateUserPortfolio);
router.route('/update-profilepic/:pid').patch(verifyJWT,portfolioUpload.single('profilePhoto'),updateUserProfile);
router.route('/add-portfolio-services/:id').patch(verifyJWT, addPortfolioServices);
router.route('/add-portfolio-client/:id').patch(verifyJWT, portfolioUpload.array("images"), addPortfolioClient);
router.route('/add-portfolio-gallery/:id').patch(verifyJWT, portfolioUpload.array("data"), addPortfolioGallery);
router.route('/delete-portfolio-item').delete(verifyJWT, deletePortfolioItem);
router.route('/get-portfolio').get(verifyJWT, authAdmin, getPortfolio);
router.route('/delete-portfolio/:pid').delete(verifyJWT, deletePortfolio);
router.route('/user-portfolio/:userName').get(getUserPortfolio);

export default router;

