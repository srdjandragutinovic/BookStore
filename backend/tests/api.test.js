// tests/api.test.js
const request = require('supertest');
const app = require('../index'); // Import your Express app

describe('Books API', () => {
  let bookId; // Store the ID of a book for testing updates and deletions

  // Test GET /books
  test('GET /books - should return a list of books with pagination', async () => {
    const response = await request(app).get('/books');
    expect(response.statusCode).toBe(200);
    expect(response.body.books).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('totalBooks');
    expect(response.body.pagination).toHaveProperty('totalPages');
  });

  // Test GET /books/:id
  test('GET /books/:id - should return details of a single book', async () => {
    const response = await request(app).get('/books/1');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title');
    expect(response.body).toHaveProperty('author');
    expect(response.body).toHaveProperty('year');
    expect(response.body).toHaveProperty('genre');
  });

  test('GET /books/:id - should return 404 if book not found', async () => {
    const response = await request(app).get('/books/999');
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Book not found');
  });

  // Test POST /books
  test('POST /books - should add a new book', async () => {
    const newBook = {
      title: 'Test Book',
      author: 'Test Author',
      year: 2023,
      genre: 'Test Genre',
    };

    const response = await request(app)
      .post('/books')
      .send(newBook);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(newBook.title);
    expect(response.body.author).toBe(newBook.author);
    expect(response.body.year).toBe(newBook.year);
    expect(response.body.genre).toBe(newBook.genre);

    bookId = response.body.id; // Save the ID for later tests
  });

  // Test PUT /books/:id
  test('PUT /books/:id - should update a book by ID', async () => {
    const updatedBook = {
      title: 'Updated Book',
      author: 'Updated Author',
      year: 2024,
      genre: 'Updated Genre',
    };

    const response = await request(app)
      .put(`/books/${bookId}`)
      .send(updatedBook);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Book updated successfully');
  });

  test('PUT /books/:id - should return 404 if book not found', async () => {
    const updatedBook = {
      title: 'Updated Book',
      author: 'Updated Author',
      year: 2024,
      genre: 'Updated Genre',
    };

    const response = await request(app)
      .put('/books/999')
      .send(updatedBook);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Book not found');
  });

  // Test DELETE /books/:id
  test('DELETE /books/:id - should delete a book by ID', async () => {
    const response = await request(app).delete(`/books/${bookId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Book deleted successfully');
  });

  test('DELETE /books/:id - should return 404 if book not found', async () => {
    const response = await request(app).delete('/books/999');
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('Book not found');
  });

  // Test GET /books/recommendations/:genre
  test('GET /books/recommendations/:genre - should return books in the given genre', async () => {
    const response = await request(app).get('/books/recommendations/Classic');
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('GET /books/recommendations/:genre - should return 404 if no books found', async () => {
    const response = await request(app).get('/books/recommendations/InvalidGenre');
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe('No books found in this genre');
  });

  // Test POST /books/import
  test('POST /books/import - should import books from a JSON file', async () => {
    const response = await request(app)
      .post('/books/import')
      .attach('file', 'path/to/test-books.json'); // Replace with a test file path

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Books imported successfully');
  });

  test('POST /books/import - should return 400 if no file is uploaded', async () => {
    const response = await request(app)
      .post('/books/import')
      .send();

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('No file uploaded');
  });
});