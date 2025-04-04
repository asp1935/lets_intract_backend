import { Router } from 'express';
import { authAllUserRole, verifyJWT, verifyJWTUser } from '../middleware/auth.middleware.js';
import { deleteApiUrls, getApiUrls, upsertApiUrls } from '../controllers/apiUrl.controller.js';
const router = Router();

router.get('/', (req, res) => {
    return res.status(200).json({ statusCode: 200, message: "API Url Working Fine" })
});

router.route('/get').get(verifyJWT, getApiUrls);
router.route('/upsert').post(verifyJWT, upsertApiUrls);
router.route('/delete').delete(verifyJWT, deleteApiUrls);


//mobile
router.route('/get-apiurl').get(verifyJWTUser, authAllUserRole, getApiUrls);

export default router;