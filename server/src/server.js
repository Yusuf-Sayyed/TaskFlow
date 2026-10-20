require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

let server;

async function startServer() {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully closing HTTP server and MongoDB connection...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
