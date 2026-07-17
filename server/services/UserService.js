import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/UserRepository.js";
import { mockDb } from "../data/mockDb.js";

const SALT_ROUNDS = 10;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000,
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

class UserService {
  async login({ email, password }) {
    const sanitizedEmail = email.trim().toLowerCase();

    const user = await UserRepository.findByEmail(sanitizedEmail);

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (user.status === "pending") {
      const error = new Error("Your account is pending approval by an administrator.");
      error.statusCode = 403;
      throw error;
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      cookieOptions,
      user: userWithoutPassword,
    };
  }

  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);

    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 400;
      throw error;
    }

    if (userData.role === "Admin") {
      const error = new Error("Administrators can only be created by an existing Admin.");
      error.statusCode = 403;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const newUser = {
      id: `u${mockDb.users.length + 1}`,
      ...userData,
      email: userData.email.trim().toLowerCase(),
      password: hashedPassword,
      submissions: [],
      scores: [],
      exams: [],
      status: userData.role === "Teacher" ? "pending" : "active",
    };

    await UserRepository.create(newUser);

    const { password: _, ...userWithoutPassword } = newUser;

    if (newUser.status === "pending") {
      return {
        data: {
          message:
            "Registration successful! Please wait for an administrator to approve your account.",
        },
      };
    }

    return {
      token: generateToken(newUser),
      cookieOptions,
      data: userWithoutPassword,
    };
  }

  async getAllUsers() {
    const users = await UserRepository.findAll();
    return users.map(({ password, ...user }) => user);
  }

  async approveTeacher(id) {
    const user = await UserRepository.findById(id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return UserRepository.update(id, { status: "active" });
  }

  async deleteUser(id) {
    const deleted = await UserRepository.delete(id);

    if (!deleted) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return true;
  }

  async getSystemStats() {
    return {
      totalUsers: mockDb.users.length,
      totalExams: mockDb.exams.length,
      totalSubmissions: mockDb.studentScores.length,
      roleDistribution: {
        Admin: mockDb.users.filter((u) => u.role === "Admin").length,
        Teacher: mockDb.users.filter((u) => u.role === "Teacher").length,
        Student: mockDb.users.filter((u) => u.role === "Student").length,
      },
      pendingApprovals: mockDb.users.filter((u) => u.status === "pending").length,
    };
  }

  async createAdmin(adminData) {
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);

    const newAdmin = {
      id: `u${mockDb.users.length + 1}`,
      ...adminData,
      password: hashedPassword,
      role: "Admin",
      status: "active",
      isSuperAdmin: false,
    };

    await UserRepository.create(newAdmin);

    const { password: _, ...safeAdmin } = newAdmin;
    return safeAdmin;
  }

  async resetPassword({ email, newPassword }) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await UserRepository.update(user.id, {
      password: hashedPassword,
    });

    return { success: true };
  }
}

export default new UserService();