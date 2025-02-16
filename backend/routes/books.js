const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
//all requirements
//added express router db first
//added multer/upload
//added fs path since it's not working with batch import/not reading

// GET request for all books
router.get('/', (req, res) => {
  db.all("SELECT * FROM books", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

//tbd GET request for single book by ID

router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM books WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Book not found' });
    }
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

  // part where insert to db
  db.run(
    "INSERT INTO books (title, author, year, genre) VALUES (?, ?, ?, ?)",
    [title, author, year, genre],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// PUT update by selected id in the url
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, author, year, genre } = req.body;

  // Validate required fields
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // update in db
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

  // file path finally
  const filePath = path.join(__dirname, '..', file.path);

  // read boy read
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read the file' });
    }

    // parse that for 400
    let books;
    try {
      books = JSON.parse(data);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // check array(also use json tool online to verify pre req)
    if (!Array.isArray(books)) {
      return res.status(400).json({ error: 'Invalid JSON format: Expected an array of books' });
    }

    // load the base
    const insertQuery = `
      INSERT INTO books (title, author, year, genre)
      VALUES (?, ?, ?, ?)
    `;

    // error handling transac(ref2stackover)
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      books.forEach((book) => {
        db.run(insertQuery, [book.title, book.author, book.year, book.genre], (err) => {
          if (err) {
            db.run('ROLLBACK'); // rollback trans if fault
            return res.status(500).json({ error: err.message });
          }
        });
      });

      db.run('COMMIT', (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Books imported successfully' });
      });
    });
  });
});



// delete by id in url
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // delete from db
  db.run("DELETE FROM books WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  });
});


// add other requests, don't forget to change the PUT request to have 5 fields for database element
// ...

module.exports = router;