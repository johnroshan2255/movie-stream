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
import { checkAdmin } from '../middleware/checkAdmin.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public routes (for authenticated users)
router.get('/', getMovies);
router.get('/user/my-movies', getMyMovies);
router.get('/search/:name', searchMovies);
router.get('/:id', getMovie);

// Admin-only routes
router.post('/', checkAdmin, createMovie);
router.put('/:id', checkAdmin, updateMovie);
router.delete('/:id', checkAdmin, deleteMovie);

export default router;
