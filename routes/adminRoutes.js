
import express from 'express';
import { getAdminData, allocateDelegate, deallocateDelegate, verifyPayment } from '../controllers/adminController.js';

const router = express.Router();

router.get('/data', getAdminData);
router.post('/allocate', allocateDelegate);
router.post('/deallocate', deallocateDelegate);
router.post('/verify', verifyPayment);

export default router;
