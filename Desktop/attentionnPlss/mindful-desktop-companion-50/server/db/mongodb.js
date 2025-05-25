const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the environment variable or fall back to a default local MongoDB URI
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/attentionPlease';
    
    console.log(`Attempting to connect to MongoDB at: ${mongoUri}`);
    
    const conn = await mongoose.connect(mongoUri, {
      // Keeping the connection options clean (deprecated options removed)
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('MongoDB connection is required for this application to run.');
    process.exit(1); // Exit the application if MongoDB connection fails
  }
};

module.exports = { connectDB };
