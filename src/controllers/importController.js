import { addMovieImportJobs, getImportQueueStatus } from '../services/movieImportService.js';

export async function importMovies(req, res, next) {
  try {
    const userId = req.user.id;
    const body = req.body;

    if (!body) {
      return res.status(400).json({
        success: false,
        message: 'Request body required: array of names or object with movieNames/movies/names'
      });
    }
    if (Array.isArray(body) && body.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movie names array cannot be empty'
      });
    }
    if (typeof body === 'object' && !Array.isArray(body) && !body.movieNames && !body.movies && !body.names) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain movieNames, movies, or names (array of strings)'
      });
    }

    const result = await addMovieImportJobs(body, userId);

    res.status(202).json({
      success: true,
      message: result.message,
      data: {
        added: result.added,
        jobIds: result.jobIds
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getImportStatus(req, res, next) {
  try {
    const status = await getImportQueueStatus();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
}
