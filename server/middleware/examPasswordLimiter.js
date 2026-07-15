import rateLimit from "express-rate-limit";

export const examPasswordLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max: 8,

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
      const userId =
        req.user?.id ||
        "anonymous";

      const examId =
        req.params?.id ||
        "unknown-exam";

      return `${userId}:${examId}`;
    },

    handler: (
      req,
      res
    ) => {
      return res
        .status(429)
        .json({
          success: false,
          message:
            "Too many incorrect password attempts. Try again later.",
        });
    },
  });