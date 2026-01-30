import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-[#cccccc] mb-4">404</h1>
        <p className="text-2xl text-gray-600 dark:text-[#9ca3af] mb-8">Page not found</p>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    </div>
  );
};
