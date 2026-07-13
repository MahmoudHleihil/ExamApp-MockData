import ConfirmationRepository from
  "../repositories/ConfirmationRepository.js";

class ConfirmationManager {
  constructor() {
    this.expiresInSeconds = Number(
      process.env.MCP_CONFIRMATION_TTL_SECONDS ||
        300
    );
  }

  async create({
    user,
    userId,
    toolName,
    args = {},
  }) {
    const resolvedUserId =
      userId || user?.id;

    if (!resolvedUserId) {
      const error = new Error(
        "Authenticated user is required for confirmation"
      );

      error.statusCode = 401;
      throw error;
    }

    return ConfirmationRepository.create({
      userId: resolvedUserId,
      toolName,
      args: this.cleanArgs(args),
      expiresInSeconds:
        this.expiresInSeconds,
    });
  }

  async findLatestPending(userId) {
    return ConfirmationRepository.findLatestPendingForUser(
      userId
    );
  }

  async findValid({
    id,
    userId,
    toolName,
  }) {
    if (!id) {
      return null;
    }

    return ConfirmationRepository.findValid({
      id,
      userId,
      toolName,
    });
  }

  async consume({
    id,
    userId,
    toolName,
  }) {
    return ConfirmationRepository.consume({
      id,
      userId,
      toolName,
    });
  }

  async verifyAndConsume({
    id,
    userId,
    toolName,
    args,
  }) {
    const confirmation =
      await this.findValid({
        id,
        userId,
        toolName,
      });

    if (!confirmation) {
      const error = new Error(
        "Invalid or expired confirmation ID"
      );

      error.statusCode = 403;
      throw error;
    }

    const expectedArgs =
      this.cleanArgs(confirmation.args);

    const actualArgs =
      this.cleanArgs(args);

    if (
      JSON.stringify(expectedArgs) !==
      JSON.stringify(actualArgs)
    ) {
      const error = new Error(
        "Confirmation arguments do not match the requested action"
      );

      error.statusCode = 403;
      throw error;
    }

    const consumed =
      await this.consume({
        id,
        userId,
        toolName,
      });

    if (!consumed) {
      const error = new Error(
        "Confirmation was already used or expired"
      );

      error.statusCode = 403;
      throw error;
    }

    return consumed;
  }

  cleanArgs(args = {}) {
    const cleaned = {
      ...args,
    };

    delete cleaned.confirmationId;
    delete cleaned.confirm;
    delete cleaned.requiresConfirmation;

    return Object.fromEntries(
      Object.entries(cleaned)
        .filter(
          ([, value]) =>
            value !== undefined &&
            value !== null &&
            value !== ""
        )
        .sort(([left], [right]) =>
          left.localeCompare(right)
        )
    );
  }

  async cleanupExpired() {
    return ConfirmationRepository
      .expirePending();
  }
}

export default new ConfirmationManager();