import React from 'react';

function ProductsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((id) => (
          <div key={id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900">Product {id}</h3>
            <p className="text-gray-600 mb-2">$99.99</p>
            <button className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;