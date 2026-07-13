import UserService from "../services/UserService.js";

export const login = async (req, res, next) => {

    try {

        const response =
            await UserService.login(req.body);

        res.cookie(
            "etest_token",
            response.token,
            response.cookieOptions
        );

        res.json(response.user);

    } catch (err) {

        next(err);

    }

};

export const register = async (req, res, next) => {

    try {

        const response =
            await UserService.register(req.body);

        if (response.token) {

            res.cookie(
                "etest_token",
                response.token,
                response.cookieOptions
            );

        }

        res.status(201).json(response.data);

    } catch (err) {

        next(err);

    }

};

export const logout = async (req, res) => {

    res.clearCookie("etest_token");

    res.json({

        success: true

    });

};

export const approveUser = async (req, res, next) => {

    try {

        const user =
            await UserService.approveTeacher(
                req.params.id
            );

        res.json(user);

    } catch (err) {

        next(err);

    }

};

export const getAllUsers = async (req, res, next) => {

    try {

        const users =
            await UserService.getAllUsers();

        res.json(users);

    } catch (err) {

        next(err);

    }

};

export const deleteUser = async (req, res, next) => {

    try {

        await UserService.deleteUser(
            req.params.id
        );

        res.json({

            success: true

        });

    } catch (err) {

        next(err);

    }

};

export const getSystemStats = async (
    req,
    res,
    next
) => {

    try {

        const stats =
            await UserService.getSystemStats();

        res.json(stats);

    } catch (err) {

        next(err);

    }

};

export const createAdmin = async (
    req,
    res,
    next
) => {

    try {

        const admin =
            await UserService.createAdmin(
                req.body,
                req.user
            );

        res.status(201).json(admin);

    } catch (err) {

        next(err);

    }

};

export const resetPassword = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await UserService.resetPassword(
                req.body
            );

        res.json(result);

    } catch (err) {

        next(err);

    }

};