import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';

const QUEUE_NAME = 'movie-import';

let queueInstance = null;

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 500 }
};

export function getMovieImportQueue() {
  if (!queueInstance) {
    const connection = getRedisClient();
    queueInstance = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions
    });
  }
  return queueInstance;
}

export { QUEUE_NAME };
