
import express from 'express';
import { registerSolo, registerGroup } from '../controllers/registrationController.js';
import { registerOC } from '../controllers/ocRegistrationController.js';

const router = express.Router();

router.post('/solo', registerSolo);
router.post('/group', registerGroup);
router.post('/oc', registerOC);

export default router;
