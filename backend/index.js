const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
//const db = require('./db/database');
const bookRoutes = require('./routes/books');


const app = express();
const PORT = 5000;

// mid-ware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// route
app.use('/books', bookRoutes);

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});