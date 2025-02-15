const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//connect to db/create new if none
const db = new sqlite3.Database(path.join(__dirname, 'bookLibrary.db'));

//books
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      year INTEGER,
      genre TEXT
    )
  `);
});

module.exports = db;