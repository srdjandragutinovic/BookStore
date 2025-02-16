// src/components/BookList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalBooks: 0,
    totalPages: 0,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, [pagination.page, pagination.limit]);

  const fetchBooks = async () => {
    const { page, limit } = pagination;
    try {
      const response = await fetch(`http://localhost:5000/books?page=${page}&limit=${limit}`);
      const data = await response.json();
      console.log('API Response:', data); // Log the response

      if (Array.isArray(data.books)) {
        setBooks(data.books);
        setPagination((prev) => ({
          ...prev,
          totalBooks: data.pagination.totalBooks,
          totalPages: data.pagination.totalPages,
        }));
        setError(''); // Clear any previous error
      } else if (data.error) {
        setBooks([]); // Set to empty array
        setError(data.error); // Display error message
      } else {
        setBooks([]); // Set to empty array
        setError('Unexpected response from the server');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]); // Set to empty array on error
      setError('Failed to fetch books');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/books/${id}`, { method: 'DELETE' });
    fetchBooks(); // Refresh the list after deletion
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`); // Navigate to EditBook with the book ID
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  return (
    <section>
      <h2>Book List</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={fetchBooks}>Refresh Books</button>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title} by {book.author} ({book.year}) - {book.genre}
            <div>
              <button onClick={() => handleDelete(book.id)}>Delete</button>
              <button onClick={() => handleEdit(book.id)}>Edit</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default BookList;