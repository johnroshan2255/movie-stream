import { Movie, User, MovieMetadata } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import tmdbService from './tmdbService.js';

class MovieService {
  validateMovieData(data, isUpdate = false) {
    const errors = [];
    const { movie_name, movie_data, torrent_magnet, movie_image_url } = data;

    if (!isUpdate && (!movie_name || movie_name.trim().length === 0)) {
      errors.push({ field: 'movie_name', message: 'Movie name is required' });
    }

    if (movie_name && movie_name.length > 255) {
      errors.push({ field: 'movie_name', message: 'Movie name must not exceed 255 characters' });
    }

    if (!isUpdate && (!torrent_magnet || torrent_magnet.trim().length === 0)) {
      errors.push({ field: 'torrent_magnet', message: 'Torrent magnet link is required' });
    }

    if (torrent_magnet && torrent_magnet.length > 5000) {
      errors.push({ field: 'torrent_magnet', message: 'Torrent magnet link is too long' });
    }

    if (movie_data && typeof movie_data !== 'object') {
      errors.push({ field: 'movie_data', message: 'Movie data must be a valid object' });
    }

    if (movie_image_url) {
      try {
        new URL(movie_image_url);
      } catch {
        errors.push({ field: 'movie_image_url', message: 'Please provide a valid URL for movie image' });
      }
    }

    return errors;
  }

  validatePagination(page, limit) {
    const errors = [];
    
    if (page && (isNaN(page) || page < 1)) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }

    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    return errors;
  }

  async getMovies(filters = {}) {
    const { search, page = 1, limit = 10 } = filters;
    
    const validationErrors = this.validatePagination(page, limit);
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Check if search parameter exists
    if (search !== undefined) {
      // If search is provided but empty or whitespace, return no results
      if (!search.trim()) {
        return {
          movies: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        };
      }
      
      // If search has valid content, perform search
      const searchLower = search.trim().toLowerCase();
      
      // Search in movie_name OR in metadata genres
      whereClause = {
        [Op.or]: [
          // Search in movie name
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('movies.movie_name')),
            { [Op.like]: `%${searchLower}%` }
          ),
          // Search in metadata genres - simple LIKE on JSON column
          sequelize.literal(`LOWER(\`metadata\`.\`genres\`) LIKE '%${searchLower}%'`)
        ]
      };
    }
    // If search parameter is not provided at all, return all movies (whereClause remains {})

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'username', 'email']
        },
        {
          model: MovieMetadata,
          as: 'metadata',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    return {
      movies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getMovieById(movieUuid) {
    if (!movieUuid || typeof movieUuid !== 'string') {
      throw { statusCode: 400, message: 'Invalid movie ID' };
    }

    const movie = await Movie.findOne({
      where: { uuid: movieUuid },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'username', 'email']
        },
        {
          model: MovieMetadata,
          as: 'metadata',
          required: false
        }
      ]
    });

    if (!movie) {
      throw { statusCode: 404, message: 'Movie not found' };
    }

    return movie;
  }

  async searchMovies(searchTerm, pagination = {}) {
    // If search term is provided but empty or whitespace, return no results
    if (searchTerm !== undefined && !searchTerm.trim()) {
      return {
        movies: [],
        pagination: {
          total: 0,
          page: parseInt(pagination.page || 1),
          limit: parseInt(pagination.limit || 10),
          totalPages: 0
        }
      };
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw { statusCode: 400, message: 'Search term is required' };
    }

    if (searchTerm.length > 100) {
      throw { statusCode: 400, message: 'Search term must not exceed 100 characters' };
    }

    const { page = 1, limit = 10 } = pagination;
    
    const validationErrors = this.validatePagination(page, limit);
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const offset = (page - 1) * limit;
    const searchLower = searchTerm.trim().toLowerCase();

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: {
        [Op.or]: [
          // Search in movie name
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('movies.movie_name')),
            { [Op.like]: `%${searchLower}%` }
          ),
          // Search in metadata genres - simple LIKE on JSON column
          sequelize.literal(`LOWER(\`metadata\`.\`genres\`) LIKE '%${searchLower}%'`)
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'username', 'email']
        },
        {
          model: MovieMetadata,
          as: 'metadata',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    return {
      movies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async createMovie(movieData, userId) {
    const validationErrors = this.validateMovieData(movieData);
    
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const { movie_name, movie_data, torrent_magnet, movie_image_url } = movieData;

    // Check if movie name already exists (case-insensitive)
    const existingMovieByName = await Movie.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('movie_name')),
        sequelize.fn('LOWER', movie_name.trim())
      )
    });

    if (existingMovieByName) {
      throw { 
        statusCode: 400, 
        message: 'A movie with this name already exists' 
      };
    }

    const movie = await Movie.create({
      movie_name: movie_name.trim(),
      movie_data,
      torrent_magnet: torrent_magnet.trim(),
      movie_image_url: movie_image_url?.trim(),
      user_id: userId
    });

    // Check if movie_data has an 'id' field to fetch metadata from TMDB API
    if (movie_data && movie_data.id) {
      try {
        const tmdbData = await tmdbService.fetchMovieMetadata(movie_data.id);
        const metadataFields = tmdbService.extractMetadata(tmdbData);
        
        await MovieMetadata.create({
          movie_id: movie.id,
          ...metadataFields
        });
      } catch (error) {
        console.error('Failed to fetch TMDB metadata:', error);
        // Don't throw error - movie creation should succeed even if metadata fetch fails
      }
    }

    return await this.getMovieById(movie.uuid);
  }

  async updateMovie(movieUuid, movieData) {
    if (!movieUuid || typeof movieUuid !== 'string') {
      throw { statusCode: 400, message: 'Invalid movie ID' };
    }

    const validationErrors = this.validateMovieData(movieData, true);
    
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const movie = await Movie.findOne({ where: { uuid: movieUuid } });

    if (!movie) {
      throw { statusCode: 404, message: 'Movie not found' };
    }

    const { movie_name, movie_data, torrent_magnet, movie_image_url } = movieData;

    const updateData = {
      movie_data: movie_data !== undefined ? movie_data : movie.movie_data,
      movie_image_url: movie_image_url ? movie_image_url.trim() : movie.movie_image_url
    };

    // Check if updating movie name and if it conflicts with existing (case-insensitive)
    if (movie_name && movie_name.trim() && movie_name.trim().toLowerCase() !== movie.movie_name.toLowerCase()) {
      const existingMovieByName = await Movie.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('movie_name')),
          sequelize.fn('LOWER', movie_name.trim())
        )
      });

      if (existingMovieByName && existingMovieByName.id !== movie.id) {
        throw { 
          statusCode: 400, 
          message: 'A movie with this name already exists' 
        };
      }

      updateData.movie_name = movie_name.trim();
    }

    if (torrent_magnet && torrent_magnet.trim()) {
      updateData.torrent_magnet = torrent_magnet.trim();
    }

    await movie.update(updateData);

    return await this.getMovieById(movie.uuid);
  }

  async deleteMovie(movieUuid) {
    if (!movieUuid || typeof movieUuid !== 'string') {
      throw { statusCode: 400, message: 'Invalid movie ID' };
    }

    const movie = await Movie.findOne({ where: { uuid: movieUuid } });

    if (!movie) {
      throw { statusCode: 404, message: 'Movie not found' };
    }

    await movie.destroy();

    return { message: 'Movie deleted successfully' };
  }

  async getUserMovies(userId, pagination = {}) {
    const { page = 1, limit = 10 } = pagination;
    
    const validationErrors = this.validatePagination(page, limit);
    if (validationErrors.length > 0) {
      throw { statusCode: 400, message: 'Validation failed', errors: validationErrors };
    }

    const offset = (page - 1) * limit;

    const { count, rows: movies } = await Movie.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['uuid', 'username', 'email']
        },
        {
          model: MovieMetadata,
          as: 'metadata',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return {
      movies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

export default new MovieService();
