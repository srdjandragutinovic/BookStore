// src/components/ImportBooks.js
import React from 'react';

const ImportBooks = ({ fetchBooks }) => { // Destructure fetchBooks from props
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    await fetch('http://localhost:5000/books/import', {
      method: 'POST',
      body: formData,
    });

    fetchBooks(); // Call fetchBooks to refresh the book list
  };

  return (
    <section>
      <h2>Import Books</h2>
      <input type="file" accept=".json" onChange={handleFileUpload} />
    </section>
  );
};

export default ImportBooks;