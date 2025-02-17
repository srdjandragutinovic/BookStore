// src/components/AddBook.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const AddBook = ({ fetchBooks }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newBook = { title, author, year: parseInt(year), genre };

    try {
      const response = await fetch('http://localhost:5000/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });

      if (response.ok) {
        setMessage('Book added successfully!');
        setTitle('');
        setAuthor('');
        setYear('');
        setGenre('');
        fetchBooks(); // Refresh the book list
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to add book');
      }
    } catch (error) {
      setMessage('An error occurred while adding the book.');
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h2>Add a New Book</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
        />
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
        />
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          required
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
        />
        <button
          type="submit"
          style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add Book
        </button>
      </form>
      {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};

export default AddBook;