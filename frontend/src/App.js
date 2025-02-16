// src/App.js
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BookList from './components/BookList';
import AddBook from './components/AddBook';
import EditBook from './components/EditBook';
import Recommendations from './components/Recommendations';
import ImportBooks from './components/ImportBooks';
import './App.css';

const App = () => {
  const [refresh, setRefresh] = useState(false);

  // Define fetchBooks function
  const fetchBooks = () => {
    setRefresh(!refresh); // Toggle refresh state to trigger re-fetch
  };

  return (
    <div className="App">
      <h1>Book Library</h1>
      <Navbar />
      <Routes>
        <Route path="/" element={<BookList refresh={refresh} />} />
        <Route path="/add" element={<AddBook fetchBooks={fetchBooks} />} />
        <Route path="/edit/:id" element={<EditBook fetchBooks={fetchBooks} />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/import" element={<ImportBooks fetchBooks={fetchBooks} />} /> {/* Pass fetchBooks */}
      </Routes>
    </div>
  );
};

export default App;