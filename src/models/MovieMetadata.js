import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MovieMetadata = sequelize.define('movie_metadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false
  },
  movie_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'movies',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  tmdb_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'The Movie Database ID'
  },
  adult: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  backdrop_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  budget: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  genres: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of genre objects'
  },
  homepage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  imdb_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  origin_country: {
    type: DataTypes.JSON,
    allowNull: true
  },
  original_language: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  original_title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  popularity: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  poster_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  release_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  revenue: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  runtime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tagline: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vote_average: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  vote_count: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['tmdb_id']
    },
    {
      fields: ['imdb_id']
    },
    {
      fields: ['movie_id']
    }
  ]
});

// Instance method to hide internal id
MovieMetadata.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.id;
  delete values.movie_id;
  return values;
};

export default MovieMetadata;
