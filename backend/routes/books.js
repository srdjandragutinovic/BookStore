const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const { cache, cacheMiddleware } = require('../middleware/cache');

// GET all books with pagination
router.get('/', cacheMiddleware, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const cacheKey = req.originalUrl;

  if (cache.has(cacheKey)) {
    console.log('Serving from cache');
    return res.json(cache.get(cacheKey));
  }

  const query = "SELECT * FROM books LIMIT ? OFFSET ?";
  db.all(query, [limit, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.get("SELECT COUNT(*) AS total FROM books", (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const totalBooks = countResult.total;
      const totalPages = Math.ceil(totalBooks / limit);

      const response = {
        books: rows || [], // Ensure books is always an array
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalBooks,
          totalPages,
        },
      };

      cache.set(cacheKey, response);
      res.json(response);
    });
  });
});

// GET a single book by ID
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

// POST - Add a single book
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
      // Clear cache
      cache.clear();

      // Create the new book object
      const newBook = { id: this.lastID, title, author, year, genre };

      // Broadcast the new book to all clients
      const { wss, broadcastUpdate } = req.app.locals;
      broadcastUpdate(wss, { type: 'bookAdded', book: newBook });

      res.status(201).json(newBook);
    }
  );
});

// PUT - Update a book by ID
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, year, genre } = req.body;

  // Validate required fields
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Update the database
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
      // Clear cache
      cache.clear();

      // Broadcast the updated book to all clients
      const { wss, broadcastUpdate } = req.app.locals;
      broadcastUpdate(wss, { type: 'bookUpdated', book: { id, title, author, year, genre } });

      res.json({ message: 'Book updated successfully' });
    }
  );
});

// POST - Batch import books from a JSON file
router.post('/import', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Resolve the file path
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

    // Validate that the data is an array
    if (!Array.isArray(books)) {
      return res.status(400).json({ error: 'Invalid JSON format: Expected an array of books' });
    }

    // Insert books into the database
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
        // Clear cache
        cache.clear();

        // Broadcast the imported books to all clients
        const { wss, broadcastUpdate } = req.app.locals;
        broadcastUpdate(wss, { type: 'booksImported', books });

        res.json({ message: 'Books imported successfully' });
      });
    });
  });
});

// DELETE - Remove a book by ID
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
    // Clear cache
    cache.clear();

    // Broadcast the deleted book ID to all clients
    const { wss, broadcastUpdate } = req.app.locals;
    broadcastUpdate(wss, { type: 'bookDeleted', id: parseInt(id) });

    res.json({ message: 'Book deleted successfully' });
  });
});

// GET - Recommendations by genre
router.get('/recommendations/:genre', cacheMiddleware, (req, res) => {
  const { genre } = req.params;

  // Query the database for books in the specified genre
  const query = "SELECT * FROM books WHERE genre = ?";
  db.all(query, [genre], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Return 404 if no books are found
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No books found in this genre' });
    }

    // Cache the result
    cache.set(req.originalUrl, rows);
    res.json(rows);
  });
});

module.exports = router;