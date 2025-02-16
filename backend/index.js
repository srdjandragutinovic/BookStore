const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger'); // Import the logger middleware
const bookRoutes = require('./routes/books');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger); // Use Morgan for logging

// Routes
app.use('/books', bookRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});