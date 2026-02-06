import fetch from 'node-fetch';
import { getMovieImportQueue } from '../queues/movieImportQueue.js';
import movieService from './movieService.js';
import torrent1337x from '../torrent/1337x.js';

const SEARCH_API_BASE = 'https://db.videasy.net/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function normalizeMovieNames(input) {
  if (Array.isArray(input)) {
    return input.map((n) => (typeof n === 'string' ? n.trim() : String(n).trim())).filter(Boolean);
  }
  if (typeof input === 'object' && input !== null && (input.movieNames || input.movies || input.names)) {
    const arr = input.movieNames || input.movies || input.names;
    return Array.isArray(arr) ? arr.map((n) => (typeof n === 'string' ? n.trim() : String(n).trim())).filter(Boolean) : [];
  }
  if (typeof input === 'string') {
    return input.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function pickBestMovieMatch(results, searchQuery) {
  const movies = (results || []).filter((r) => r.media_type === 'movie');
  if (movies.length === 0) return null;

  const queryNorm = searchQuery.trim().toLowerCase();

  const matchesByTitle = movies.filter(
    (m) =>
      (m.original_title && m.original_title.trim().toLowerCase() === queryNorm) ||
      (m.title && m.title.trim().toLowerCase() === queryNorm)
  );

  const candidates = matchesByTitle.length > 0 ? matchesByTitle : movies;
  candidates.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  return candidates[0] || null;
}

async function searchMovieFromAPI(query) {
  const url = `${SEARCH_API_BASE}/search/multi?language=en&page=1&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return pickBestMovieMatch(data.results, query);
}

async function processOneMovie(movieName, userId) {
  const raw = await torrent1337x(movieName, '1');
  // 1337x returns a single object on success, null on failure (not an array)
  const torrent = Array.isArray(raw) ? raw[0] : raw;
  if (!torrent || typeof torrent.Magnet === 'undefined') {
    return { status: 'skipped', reason: 'no_torrent' };
  }

  const movieFromAPI = await searchMovieFromAPI(torrent.Name);
  if (!movieFromAPI) return { status: 'skipped', reason: 'no_api_match' };

  const movieData = {
    movie_name: movieFromAPI.title || movieFromAPI.original_title || movieName,
    movie_data: {
      id: movieFromAPI.id,
      original_title: movieFromAPI.original_title,
      title: movieFromAPI.title,
      release_date: movieFromAPI.release_date,
      overview: movieFromAPI.overview,
    },
    torrent_magnet: torrent.Magnet || '',
    movie_image_url: movieFromAPI.poster_path ? `${IMAGE_BASE}${movieFromAPI.poster_path}` : (torrent.Poster || '')
  };

  try {
    await movieService.createMovie(movieData, userId);
    return { status: 'created', name: movieData.movie_name };
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      return { status: 'skipped', reason: 'duplicate' };
    }
    throw err;
  }
}

export async function addMovieImportJobs(movieNamesOrObject, userId) {
  const names = normalizeMovieNames(movieNamesOrObject);
  if (names.length === 0) {
    return { added: 0, message: 'No valid movie names provided' };
  }

  const queue = getMovieImportQueue();
  const jobs = await queue.addBulk(
    names.map((name) => ({
      name: 'import',
      data: { movieName: name, userId }
    }))
  );

  return {
    added: jobs.length,
    jobIds: jobs.map((j) => j.id),
    message: `Queued ${jobs.length} movie(s) for import`
  };
}

export async function getImportQueueStatus() {
  const queue = getMovieImportQueue();
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed
  };
}

export { processOneMovie, normalizeMovieNames };
