import React from 'react';
import { useAuthStore } from '../hooks/useAuthStore';

function ProfilePage() {
  const { user, isAuthenticated, login } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Login</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <button
            onClick={() => login({ name: 'Test User', email: 'test@example.com' })}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
          >
            Login as Test User
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">User Information</h2>
        <p className="text-gray-600">Name: {user?.name}</p>
        <p className="text-gray-600">Email: {user?.email}</p>
      </div>
    </div>
  );
}

export default ProfilePage;