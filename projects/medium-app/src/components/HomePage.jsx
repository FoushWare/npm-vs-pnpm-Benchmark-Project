import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';

function HomePage() {
  const { theme, toggleTheme } = useStore();
  
  return (
    <div className="home-page">
      <h1>Home Page</h1>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <p>Current theme: {theme}</p>
      <Link to="/about">Go to About</Link>
    </div>
  );
}

export default HomePage;