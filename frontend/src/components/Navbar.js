// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/add">Add Book</Link>
      <Link to="/import">Import Books</Link>
      <Link to="/recommendations">Recommendations</Link>
    </nav>
  );
};

export default Navbar;