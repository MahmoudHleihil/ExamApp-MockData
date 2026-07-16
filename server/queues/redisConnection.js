function parseRedisUrl() {
  const redisUrl =
    process.env.REDIS_URL;

  if (!redisUrl) {
    return null;
  }

  const url =
    new URL(redisUrl);

  return {
    host:
      url.hostname,

    port:
      Number(
        url.port || 6379
      ),

    username:
      url.username ||
      undefined,

    password:
      url.password ||
      undefined,

    /*
     * BullMQ workers require this value.
     * It is also safe for the producer.
     */
    maxRetriesPerRequest:
      null,
  };
}

export function getRedisConnection() {
  return parseRedisUrl();
}