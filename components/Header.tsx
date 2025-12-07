import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100 transition-all duration-300">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-end h-24 pb-6">
          <div 
            className="flex-shrink-0 cursor-pointer group" 
            onClick={() => setViewMode(ViewMode.GALLERY)}
          >
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 group-hover:opacity-70 transition-opacity">
              ALEXANDRA
            </h1>
            <div className="flex items-center gap-3 mt-1">
               <span className="h-[1px] w-8 bg-zinc-900"></span>
               <span className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-medium">
                Galerie
              </span>
            </div>
          </div>
          
          <nav className="flex space-x-12 pb-1">
            <button
              onClick={() => setViewMode(ViewMode.GALLERY)}
              className={`text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
                viewMode === ViewMode.GALLERY 
                  ? 'text-zinc-900 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Collection
            </button>
            <button
              onClick={() => setViewMode(viewMode === ViewMode.ADMIN ? ViewMode.GALLERY : ViewMode.LOGIN)}
              className={`text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
                viewMode === ViewMode.ADMIN || viewMode === ViewMode.LOGIN
                  ? 'text-zinc-900 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              {viewMode === ViewMode.ADMIN ? 'Curator' : 'Artist Login'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};