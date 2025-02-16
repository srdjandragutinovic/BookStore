const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const { cache, cacheMiddleware } = require('../middleware/cache'); // Import cache middleware
//all requirements
//added express router db first
//added multer/upload
//added fs path since it's not working with batch import/not reading

// GET request for all books (with caching)
router.get('/', cacheMiddleware, (req, res) => {
  db.all("SELECT * FROM books", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Cache the result
    cache.set(req.originalUrl, rows);
    res.json(rows);
  });
});

//tbd GET request for single book by ID

// GET request for single book by ID (with caching)
router.get('/:id', cacheMiddleware, (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }
    // Cache the result
    cache.set(req.originalUrl, row);
    res.json(row);
  });
});

// POST - add a single book
router.post('/', (req, res) => {
  const { title, author, year, genre } = req.body;

  // Validate required fields
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Insert into the database
  db.run(
    "INSERT INTO books (title, author, year, genre) VALUES (?, ?, ?, ?)",
    [title, author, year, genre],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // Clear the cache for all books
      cache.clear();
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT update by selected id in the url
// PUT update by selected id in the URL
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, year, genre } = req.body;

  // Validate required fields
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Update in the database
  db.run(
    "UPDATE books SET title = ?, author = ?, year = ?, genre = ? WHERE id = ?",
    [title, author, year, genre, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }
      // Clear the cache for all books
      cache.clear();
      res.json({ message: 'Book updated successfully' });
    }
  );
});


// POST /books/import - batch upload for all books via JSON file
router.post('/import', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // File path
  const filePath = path.join(__dirname, '..', file.path);

  // Read the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read the file' });
    }

    // Parse the JSON data
    let books;
    try {
      books = JSON.parse(data);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Check if the data is an array
    if (!Array.isArray(books)) {
      return res.status(400).json({ error: 'Invalid JSON format: Expected an array of books' });
    }

    // Insert the books into the database
    const insertQuery = `
      INSERT INTO books (title, author, year, genre)
      VALUES (?, ?, ?, ?)
    `;

    // Use a transaction for error handling
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      books.forEach((book) => {
        db.run(insertQuery, [book.title, book.author, book.year, book.genre], (err) => {
          if (err) {
            db.run('ROLLBACK'); // Rollback the transaction if there's an error
            return res.status(500).json({ error: err.message });
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // Clear the cache for all books
        cache.clear();
        res.json({ message: 'Books imported successfully' });
      });
    });
  });
});



// DELETE by ID in the URL
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Delete from the database
  db.run("DELETE FROM books WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    // Clear the cache for all books
    cache.clear();
    res.json({ message: 'Book deleted successfully' });
  });
});

// GET /books/recommendations/:genre – Returns a list of books in the given genre (with caching)
router.get('/recommendations/:genre', cacheMiddleware, (req, res) => {
  const { genre } = req.params;

  // Query the database for books in the specified genre
  const query = "SELECT * FROM books WHERE genre = ?";
  db.all(query, [genre], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // If no books are found, return a 404 error
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No books found in this genre' });
    }

    // Cache the result
    cache.set(req.originalUrl, rows);
    res.json(rows);
  });
});

// add other requests, don't forget to change the PUT request to have 5 fields for database element
// ...

module.exports = router;