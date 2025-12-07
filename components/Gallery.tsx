import React, { useState } from 'react';
import { Artwork } from '../types';

interface GalleryProps {
  artworks: Artwork[];
}

export const Gallery: React.FC<GalleryProps> = ({ artworks }) => {
  const [selectedImage, setSelectedImage] = useState<Artwork | null>(null);

  if (artworks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 border border-zinc-200 rounded-full mb-6 flex items-center justify-center">
          <span className="text-2xl text-zinc-300">✦</span>
        </div>
        <h3 className="text-xl font-serif text-zinc-900 mb-2">Collection Empty</h3>
        <p className="text-zinc-400 max-w-md font-light">The curator is currently updating the exhibition.</p>
      </div>
    );
  }

  return (
    <div className="py-16 px-6 lg:px-12 max-w-[1800px] mx-auto">
      {/* Masonry Layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12">
        {artworks.map((art) => (
          <div 
            key={art.id} 
            className="break-inside-avoid group cursor-pointer mb-12"
            onClick={() => setSelectedImage(art)}
          >
            <div className="relative overflow-hidden bg-zinc-50">
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:opacity-95"
                loading="lazy"
              />
            </div>
            
            <div className="mt-6 flex justify-between items-start opacity-80 group-hover:opacity-100 transition-opacity duration-500">
              <div>
                <h3 className="font-serif text-lg text-zinc-900 leading-none">
                  {art.title}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-[0.15em]">{art.medium}</p>
              </div>
              <span className="text-zinc-300 group-hover:text-zinc-900 transition-colors text-lg">
                →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Viewing Room Modal (Lightbox) */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white animate-fade-in">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 z-50 text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-2 group"
          >
            <span className="text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="w-full h-full flex flex-col md:flex-row">
            {/* Image Container */}
            <div className="flex-1 h-1/2 md:h-full flex items-center justify-center p-8 md:p-16 bg-white">
              <img 
                src={selectedImage.imageUrl} 
                alt={selectedImage.title} 
                className="max-w-full max-h-full object-contain shadow-sm"
              />
            </div>

            {/* Details Container */}
            <div className="md:w-[450px] h-1/2 md:h-full p-8 md:p-16 overflow-y-auto bg-white border-t md:border-t-0 md:border-l border-zinc-100 flex flex-col justify-center">
              <div className="space-y-8">
                <div>
                  <h2 className="font-serif text-4xl text-zinc-900 mb-4">{selectedImage.title}</h2>
                  <div className="w-12 h-[1px] bg-zinc-900 mb-4"></div>
                  <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs">
                    {selectedImage.medium}
                  </p>
                </div>
                
                <p className="text-zinc-600 leading-relaxed font-light text-sm md:text-base">
                  {selectedImage.description}
                </p>
                
                <div className="pt-8">
                   <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {selectedImage.tags.map(tag => (
                      <span key={tag} className="text-zinc-400 text-[10px] uppercase tracking-widest border border-zinc-100 px-2 py-1">
                        {tag}
                      </span>
                    ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};