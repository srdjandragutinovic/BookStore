// src/components/Recommendations.js
import React, { useState } from 'react';

const Recommendations = () => {
  const [genre, setGenre] = useState('');
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    if (!genre || genre.trim() === '') {
      setError('Please enter a genre'); // Display error for empty genre
      setBooks([]); // Clear the books list
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/books/recommendations/${genre}`);
      const data = await response.json();
      console.log('API Response:', data); // Log the response

      if (Array.isArray(data.books)) {
        setBooks(data.books);
        setError(data.message); // Display the message from the backend
      } else {
        setBooks([]); // Set to empty array if data.books is not an array
        setError('Unexpected response from the server');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setBooks([]); // Set to empty array on error
      setError('Failed to fetch recommendations');
    }
  };

  return (
    <section>
      <h2>Book Recommendations</h2>
      <input
        type="text"
        placeholder="Enter genre"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      />
      <button onClick={fetchRecommendations}>Get Recommendations</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title} by {book.author} ({book.year}) - {book.genre}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Recommendations;