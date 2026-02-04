import app from './src/app.js';
import dotenv from 'dotenv';
import sequelize from './src/config/database.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models
    // Use force: true only in development when you need to recreate tables
    // For UUID migration: DROP DATABASE movie_stream; CREATE DATABASE movie_stream;
    const syncOptions = process.env.DB_FORCE_SYNC === 'true' 
      ? { force: true } 
      : { alter: true };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Database models synchronized.');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
