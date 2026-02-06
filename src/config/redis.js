import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClientInstance = null;
let redisWorkerInstance = null;

function createRedisConnection() {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 100, 3000)
    });
  }
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy: (times) => Math.min(times * 100, 3000)
  });
}

export function getRedisClient() {
  if (!redisClientInstance) {
    redisClientInstance = createRedisConnection();
    redisClientInstance.on('error', (err) => console.error('[Redis Client]', err.message));
    redisClientInstance.on('connect', () => console.log('[Redis Client] Connected'));
  }
  return redisClientInstance;
}

export function getRedisWorker() {
  if (!redisWorkerInstance) {
    redisWorkerInstance = createRedisConnection();
    redisWorkerInstance.on('error', (err) => console.error('[Redis Worker]', err.message));
    redisWorkerInstance.on('connect', () => console.log('[Redis Worker] Connected'));
  }
  return redisWorkerInstance;
}

export function closeRedisConnections() {
  if (redisClientInstance) {
    redisClientInstance.disconnect();
    redisClientInstance = null;
  }
  if (redisWorkerInstance) {
    redisWorkerInstance.disconnect();
    redisWorkerInstance = null;
  }
}
