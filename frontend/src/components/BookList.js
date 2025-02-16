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

    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      if (data.type === 'bookAdded') {
        // Add the new book to the list
        setBooks((prevBooks) => [...prevBooks, data.book]);
      } else if (data.type === 'bookDeleted') {
        // Remove the deleted book from the list
        setBooks((prevBooks) => prevBooks.filter((book) => book.id !== data.id));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, [pagination.page, pagination.limit]);

  const fetchBooks = async () => {
    const { page, limit } = pagination;
    try {
      const response = await fetch(`http://localhost:5000/books?page=${page}&limit=${limit}`);
      const data = await response.json();
      console.log('API Response:', data);

      if (Array.isArray(data.books)) {
        setBooks(data.books);
        setPagination((prev) => ({
          ...prev,
          totalBooks: data.pagination.totalBooks,
          totalPages: data.pagination.totalPages,
        }));
        setError('');
      } else if (data.error) {
        setBooks([]);
        setError(data.error);
      } else {
        setBooks([]);
        setError('Unexpected response from the server');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
      setError('Failed to fetch books');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/books/${id}`, { method: 'DELETE' });
    // No need to call fetchBooks() here, as WebSocket will handle the update
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
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