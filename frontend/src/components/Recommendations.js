import React, { useState, useEffect } from 'react';

const Recommendations = () => {
  const [genre, setGenre] = useState('');
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);
  const [page, setPage] = useState(1); // Current page
  const [limit, setLimit] = useState(10); // Books per page
  const [totalPages, setTotalPages] = useState(0); // Total pages
  const [totalBooks, setTotalBooks] = useState(0); // Total books in the genre

  // Fetch genres from the backend when the component mounts
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('http://localhost:5000/books/genres');
        const data = await response.json();
        if (response.ok) {
          setGenres(data);
        } else {
          throw new Error(data.error || 'Failed to fetch genres');
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        setError('Failed to fetch genres');
      }
    };

    fetchGenres();
  }, []);

  const fetchRecommendations = async () => {
    if (!genre || genre.trim() === '') {
      setError('Please select a genre'); // Display error for empty genre
      setBooks([]); // Clear the books list
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/books/recommendations/${genre}?page=${page}&limit=${limit}`
      );
      const data = await response.json();
      console.log('API Response:', data); // Log the response

      if (!response.ok) {
        // Handle server errors (e.g., 404 or 500)
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      if (data.books && Array.isArray(data.books)) {
        // Backend returns an array of books and pagination info
        setBooks(data.books);
        setTotalBooks(data.pagination.totalBooks);
        setTotalPages(data.pagination.totalPages);
        setError(''); // Clear any previous errors
      } else {
        // Handle unexpected response format
        setBooks([]);
        setError('Unexpected response from the server');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setBooks([]); // Set to empty array on error
      setError(error.message || 'Failed to fetch recommendations');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchRecommendations(); // Fetch recommendations for the new page
    }
  };

  return (
    <section>
      <h2>Book Recommendations</h2>
      <select
        value={genre}
        onChange={(e) => {
          setGenre(e.target.value);
          setPage(1); // Reset to the first page when genre changes
        }}
        style={{ padding: '8px', marginRight: '10px', borderRadius: '4px' }}
      >
        <option value="">Select a genre</option>
        {genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <button onClick={fetchRecommendations}>Get Recommendations</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title} by {book.author} ({book.year}) - {book.genre}
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      {books.length > 0 && (
        <div>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages} (Total books: {totalBooks})
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default Recommendations;