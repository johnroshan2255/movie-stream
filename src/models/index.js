import sequelize from '../config/database.js';
import User from './User.js';
import Movie from './Movie.js';

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

export { sequelize, User, Movie };
