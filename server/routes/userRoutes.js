import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { loginValidation, registerValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/login', loginValidation, userController.login);
router.post('/register', registerValidation, userController.register);
router.post('/logout', userController.logout);

// Protected routes
router.get('/', authenticate, authorize('Admin'), userController.getAllUsers);
router.get('/stats', authenticate, authorize('Admin'), userController.getSystemStats);
router.put('/approve/:id', authenticate, authorize('Admin'), userController.approveUser);
router.delete('/:id', authenticate, authorize('Admin'), userController.deleteUser);

router.post('/admin', authenticate, authorize('Admin'), userController.createAdmin);
router.post('/reset-password', userController.resetPassword);

export default router;
