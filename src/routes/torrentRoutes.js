import express from 'express';
import { searchTorrents } from '../controllers/torrentController.js';
import { importMovies, getImportStatus } from '../controllers/importController.js';
import { authenticate } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/checkAdmin.js';

const router = express.Router();

router.use(authenticate);
router.use(checkAdmin);

router.get('/search', searchTorrents);
router.post('/import-movies', importMovies);
router.get('/import-movies/status', getImportStatus);

export default router;
