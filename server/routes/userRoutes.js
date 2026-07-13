import express from "express";
import * as UserController from "../controllers/userController.js";
import {
    authenticate,
    authorize
} from "../middleware/authMiddleware.js";

import {
    loginValidation,
    registerValidation
} from "../middleware/validationMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    loginValidation,
    UserController.login
);

router.post(
    "/register",
    registerValidation,
    UserController.register
);

router.post(
    "/logout",
    authenticate,
    UserController.logout
);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/

router.get(
    "/",
    authenticate,
    authorize("Admin"),
    UserController.getAllUsers
);

router.get(
    "/stats",
    authenticate,
    authorize("Admin"),
    UserController.getSystemStats
);

router.post(
    "/admin",
    authenticate,
    authorize("Admin"),
    UserController.createAdmin
);

router.put(
    "/approve/:id",
    authenticate,
    authorize("Admin"),
    UserController.approveUser
);

router.delete(
    "/:id",
    authenticate,
    authorize("Admin"),
    UserController.deleteUser
);

router.post(
    "/reset-password",
    UserController.resetPassword
);

export default router;