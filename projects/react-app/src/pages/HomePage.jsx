import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Our Store
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Discover amazing products at great prices
      </p>
      <Link
        to="/products"
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
      >
        Browse Products
      </Link>
    </div>
  );
}

export default HomePage;