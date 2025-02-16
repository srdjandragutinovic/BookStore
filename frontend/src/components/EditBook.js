// src/components/EditBook.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditBook = () => {
  const { id } = useParams(); // Get the book ID from the URL
  const navigate = useNavigate(); // Hook for navigation
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    const response = await fetch(`http://localhost:5000/books/${id}`);
    const data = await response.json();
    setTitle(data.title);
    setAuthor(data.author);
    setYear(data.year);
    setGenre(data.genre);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedBook = { title, author, year: parseInt(year), genre };

    await fetch(`http://localhost:5000/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedBook),
    });

    navigate('/'); // Navigate back to the book list after updating
  };

  return (
    <div>
      <h2>Edit Book</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          required
        />
        <button type="submit">Update Book</button>
      </form>
    </div>
  );
};

export default EditBook;