import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Dumbbell, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
      <div className="w-16 h-16 rounded-3xl bg-lime/10 border border-lime/30 flex items-center justify-center text-lime mb-4 shadow-lime-sm">
        <Dumbbell className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        The route you are looking for does not exist or has been moved. Let's get you back to your workout dashboard.
      </p>
      <Link to="/app/dashboard">
        <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};
