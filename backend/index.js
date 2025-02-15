const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
//const db = require('./db/database');
const bookRoutes = require('./routes/books');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/books', bookRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});