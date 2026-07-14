import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import pool, { testDatabaseConnection, closeDatabase,} from "./config/database.js";

import examRoutes from './routes/examRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import documentRoutes from "./routes/documentRoutes.js";

import errorHandler from "./middleware/errorHandler.js";

import chatRoutes from "./routes/chatRoutes.js";


const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow self, inline, and eval for React/Vite
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*"], // Support Vite HMR and API
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error(
        `CORS blocked origin: ${origin}`
      );

      error.statusCode = 403;
      callback(error);
    },

    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 for development
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply the rate limiting middleware to all requests
app.use('/api/', limiter);

// Specific rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Reduced to 15 minutes
  max: 50, // Increased to 50 attempts
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);

app.get('/', (req, res) => {
  res.send('ExamApp Server is running');
});

app.get("/api/health", async (req, res) => {
  try {
    const database = await testDatabaseConnection();

    res.json({
      status: "ok",
      message: "Server is healthy",
      database: {
        status: "connected",
        name: database.database_name,
        user: database.database_user,
        connectedAt: database.connected_at,
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      message: "Database connection failed",
      database: {
        status: "disconnected",
      },
    });
  }
});

app.use(errorHandler);

async function startServer() {
  try {
    const database = await testDatabaseConnection();

    console.log("PostgreSQL connection verified:", {
      database: database.database_name,
      user: database.database_user,
      connectedAt: database.connected_at,
    });

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          await closeDatabase();
          console.log("PostgreSQL pool closed");
          process.exit(0);
        } catch (error) {
          console.error("Shutdown error:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", {
      message: error.message,
      code: error.code,
    });

    process.exit(1);
  }
}

startServer();