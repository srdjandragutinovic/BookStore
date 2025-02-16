const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const { cache, cacheMiddleware } = require('../middleware/cache'); // import cache middleware
//all requirements
//added express router db first
//added multer/upload
//added fs path since it's not working with batch import/not reading

// GET req - all books + cache
router.get('/', cacheMiddleware, (req, res) => {
  db.all("SELECT * FROM books", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // cache part
    cache.set(req.originalUrl, rows);
    res.json(rows);
  });
});

//tbd GET request for single book by ID

// GET request single book + cache
router.get('/:id', cacheMiddleware, (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }
    // cache part
    cache.set(req.originalUrl, row);
    res.json(row);
  });
});

// POST - add a single book
router.post('/', (req, res) => {
  const { title, author, year, genre } = req.body;

  // check fields
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // db insert
  db.run(
    "INSERT INTO books (title, author, year, genre) VALUES (?, ?, ?, ?)",
    [title, author, year, genre],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      // cache clear
      cache.clear();
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT update by selected id in the url
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, year, genre } = req.body;

  // check input
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // db update
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
      // cache clear
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

  // pathing issue i had
  const filePath = path.join(__dirname, '..', file.path);

  // read the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read the file' });
    }

    // rarse the JSON data - if unsure use online json formatter to check
    let books;
    try {
      books = JSON.parse(data);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // check if the data is an array
    if (!Array.isArray(books)) {
      return res.status(400).json({ error: 'Invalid JSON format: Expected an array of books' });
    }

    // add to db
    const insertQuery = `
      INSERT INTO books (title, author, year, genre)
      VALUES (?, ?, ?, ?)
    `;

    // use a transaction for error handling - refer to recommendation
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      books.forEach((book) => {
        db.run(insertQuery, [book.title, book.author, book.year, book.genre], (err) => {
          if (err) {
            db.run('ROLLBACK'); // rollback the transaction if there's an error
            return res.status(500).json({ error: err.message });
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        // clear cache
        cache.clear();
        res.json({ message: 'Books imported successfully' });
      });
    });
  });
});



// DELETE by ID in the URL
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // delete from the database
  db.run("DELETE FROM books WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    // cache clear
    cache.clear();
    res.json({ message: 'Book deleted successfully' });
  });
});

// GET /books/recommendations/:genre – list of books + cache
router.get('/recommendations/:genre', cacheMiddleware, (req, res) => {
  const { genre } = req.params;

  // db call for genre
  const query = "SELECT * FROM books WHERE genre = ?";
  db.all(query, [genre], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // 404 if none
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No books found in this genre' });
    }

    // cache
    cache.set(req.originalUrl, rows);
    res.json(rows);
  });
});

// add other requests, don't forget to change the PUT request to have 5 fields for database element
// fixed 16/02/2025 19:24
// backend part fully functionall with all requests/log/cache/gitignore

module.exports = router;