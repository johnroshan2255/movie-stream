import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Movie = sequelize.define('movies', {
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
  movie_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  movie_data: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Stores large JSON data for movie details',
    get() {
      const rawValue = this.getDataValue('movie_data');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('movie_data', JSON.stringify(value));
    }
  },
  torrent_magnet: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Stores torrent magnet link',
    validate: {
      notEmpty: true
    }
  },
  movie_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['movie_name'],
      name: 'unique_movie_name'
    },
    {
      fields: ['movie_name']
    },
    {
      fields: ['user_id']
    }
  ]
});

// Instance method to hide internal id
Movie.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.id;
  delete values.user_id;
  return values;
};

export default Movie;
