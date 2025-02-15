const db = require('./database');

//check db connection/return if something
db.get("SELECT * FROM books", (err, row) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log(row || 'No books found');
  }
});