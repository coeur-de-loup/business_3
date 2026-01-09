import { Redis } from '@upstash/redis';

const getRedisClient = () => {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    return new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  }

  // Fallback for development (optional)
  return null;
};

export const redis = getRedisClient();
