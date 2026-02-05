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

    // Sync database models (creates tables if they don't exist)
    // Set DB_FORCE_SYNC=true in .env to drop and recreate all tables (development only)
    const syncOptions = process.env.DB_FORCE_SYNC === 'true' 
      ? { force: true } 
      : {};
    
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
