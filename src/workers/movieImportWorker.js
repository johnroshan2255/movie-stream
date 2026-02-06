import { Worker } from 'bullmq';
import { getRedisWorker } from '../config/redis.js';
import { QUEUE_NAME } from '../queues/movieImportQueue.js';
import { processOneMovie } from '../services/movieImportService.js';

let workerInstance = null;

const concurrency = 1;
const limiter = {
  max: 1,
  duration: 8000
};

export function startMovieImportWorker() {
  if (workerInstance) {
    return workerInstance;
  }

  const connection = getRedisWorker();
  workerInstance = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { movieName, userId } = job.data;
      if (!movieName || !userId) {
        throw new Error('Missing movieName or userId');
      }
      const result = await processOneMovie(movieName, userId);
      return result;
    },
    {
      connection,
      concurrency,
      limiter
    }
  );

  workerInstance.on('completed', (job, result) => {
    console.log(`[Import] Completed ${job.data.movieName}:`, result.status);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`[Import] Failed ${job?.data?.movieName}:`, err.message);
  });

  workerInstance.on('error', (err) => {
    console.error('[Import Worker] Error:', err.message);
  });

  console.log('[Import Worker] Started');
  return workerInstance;
}

export function getMovieImportWorker() {
  return workerInstance;
}

export function stopMovieImportWorker() {
  if (workerInstance) {
    return workerInstance.close();
  }
  return Promise.resolve();
}
