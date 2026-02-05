import sequelize from '../config/database.js';
import User from './User.js';
import Movie from './Movie.js';
import MovieMetadata from './MovieMetadata.js';

// Define relationships
User.hasMany(Movie, {
  foreignKey: 'user_id',
  as: 'movies',
  onDelete: 'CASCADE'
});

Movie.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Movie.hasOne(MovieMetadata, {
  foreignKey: 'movie_id',
  as: 'metadata',
  onDelete: 'CASCADE'
});

MovieMetadata.belongsTo(Movie, {
  foreignKey: 'movie_id',
  as: 'movie'
});

export { sequelize, User, Movie, MovieMetadata };
