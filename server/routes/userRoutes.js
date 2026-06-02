import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/admin', userController.createAdmin);
router.put('/approve/:id', userController.approveUser);
router.get('/', userController.getAllUsers);
router.delete('/:id', userController.deleteUser);
router.get('/stats', userController.getSystemStats);
router.post('/reset-password', userController.resetPassword);

export default router;
