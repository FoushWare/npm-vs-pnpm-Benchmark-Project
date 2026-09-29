import React from 'react';
import { Link } from 'react-router-dom';

function AboutPage() {
  return (
    <div className="about-page">
      <h1>About Page</h1>
      <p>This is a medium-sized React application for benchmarking.</p>
      <Link to="/">Go to Home</Link>
    </div>
  );
}

export default AboutPage;