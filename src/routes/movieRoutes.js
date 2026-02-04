import express from 'express';
import {
  getMovies,
  getMovie,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  getMyMovies
} from '../controllers/movieController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMovies);
router.get('/user/my-movies', getMyMovies);
router.get('/search/:name', searchMovies);
router.get('/:id', getMovie);
router.post('/', createMovie);
router.put('/:id', updateMovie);
router.delete('/:id', deleteMovie);

export default router;
