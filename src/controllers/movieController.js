import movieService from '../services/movieService.js';

export const getMovies = async (req, res, next) => {
  try {
    const result = await movieService.getMovies(req.query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMovie = async (req, res, next) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);

    res.status(200).json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

export const searchMovies = async (req, res, next) => {
  try {
    const result = await movieService.searchMovies(req.params.name, req.query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const createMovie = async (req, res, next) => {
  try {
    const movie = await movieService.createMovie(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const movie = await movieService.updateMovie(req.params.id, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    await movieService.deleteMovie(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyMovies = async (req, res, next) => {
  try {
    const result = await movieService.getUserMovies(req.user.id, req.query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
