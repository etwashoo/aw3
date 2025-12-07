import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div 
            className="flex-shrink-0 cursor-pointer flex flex-col" 
            onClick={() => setViewMode(ViewMode.GALLERY)}
          >
            <h1 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
              ALEXANDRA <span className="text-stone-500 font-normal">STUDIOS</span>
            </h1>
            <span className="text-xs uppercase tracking-widest text-stone-400 mt-1">
              Fine Art & Photography
            </span>
          </div>
          
          <nav className="flex space-x-8">
            <button
              onClick={() => setViewMode(ViewMode.GALLERY)}
              className={`text-sm uppercase tracking-wide font-medium transition-colors ${
                viewMode === ViewMode.GALLERY 
                  ? 'text-stone-900 border-b-2 border-stone-900' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setViewMode(viewMode === ViewMode.ADMIN ? ViewMode.GALLERY : ViewMode.LOGIN)}
              className={`text-sm uppercase tracking-wide font-medium transition-colors ${
                viewMode === ViewMode.ADMIN || viewMode === ViewMode.LOGIN
                  ? 'text-stone-900 border-b-2 border-stone-900' 
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {viewMode === ViewMode.ADMIN ? 'Admin Panel' : 'Artist Login'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
