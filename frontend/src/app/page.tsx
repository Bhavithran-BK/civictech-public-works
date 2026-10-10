'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 text-white font-bold flex items-center justify-center rounded">
              DO
            </div>
            <span className="font-bold text-xl text-gray-800">DigOnce</span>
          </div>
          <Link
            href="/dept/login"
            className="text-sm font-medium text-blue-700 hover:underline flex items-center gap-1"
          >
            <ShieldCheck className="w-4 h-4" />
            Department Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Public Works Coordination Portal
        </h1>
        <p className="text-gray-600 max-w-lg mb-8">
          This is the citizen-facing portal (Role A responsibility). The map and public project list will be integrated here.
        </p>
        <div className="bg-white p-6 border border-gray-200 rounded shadow-sm max-w-md w-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Government Officials</h2>
          <p className="text-sm text-gray-600 mb-4">
            Authorized personnel can access the coordination dashboard to schedule works and manage conflicts.
          </p>
          <Link
            href="/dept/login"
            className="inline-block w-full text-center px-4 py-2 bg-blue-700 text-white font-medium rounded hover:bg-blue-800 transition-colors"
          >
            Proceed to Officer Login
          </Link>
        </div>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        DigOnce Initiative • Department of Civic Works
      </footer>
    </div>
  );
}
