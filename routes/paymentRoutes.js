
import express from 'express';
import { getPaymentDetails, submitPayment } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/:refId', getPaymentDetails);
router.post('/submit', submitPayment);

export default router;
