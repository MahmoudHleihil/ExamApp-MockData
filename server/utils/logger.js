const logger = {
  info(message, metadata = {}) {
    console.log(message, metadata);
  },

  warn(message, metadata = {}) {
    console.warn(message, metadata);
  },

  error(message, metadata = {}) {
    console.error(message, metadata);
  },

  debug(message, metadata = {}) {
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      console.debug(
        message,
        metadata
      );
    }
  },
};

export default logger;