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
        <div className="w-16 h-16 border-2 border-stone-300 rounded-full mb-6 flex items-center justify-center">
          <span className="text-2xl">🖼️</span>
        </div>
        <h3 className="text-xl font-serif text-stone-900 mb-2">No artwork displayed yet</h3>
        <p className="text-stone-500 max-w-md">The artist is currently curating their collection. Please check back soon or log in to the admin panel to add pieces.</p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Masonry Layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {artworks.map((art) => (
          <div 
            key={art.id} 
            className="break-inside-avoid group cursor-pointer mb-8"
            onClick={() => setSelectedImage(art)}
          >
            <div className="relative overflow-hidden bg-stone-200">
              <img 
                src={art.imageUrl} 
                alt={art.title} 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors duration-500" />
            </div>
            
            <div className="mt-4">
              <h3 className="font-serif text-lg text-stone-900 leading-tight group-hover:text-amber-700 transition-colors">
                {art.title}
              </h3>
              <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">{art.medium}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/95 backdrop-blur-sm animate-fade-in">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="bg-white max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl">
            <div className="md:w-2/3 bg-stone-100 flex items-center justify-center p-2">
              <img 
                src={selectedImage.imageUrl} 
                alt={selectedImage.title} 
                className="max-w-full max-h-[85vh] object-contain"
              />
            </div>
            <div className="md:w-1/3 p-8 md:p-12 overflow-y-auto bg-stone-50 flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-2">{selectedImage.title}</h2>
                  <p className="text-stone-500 uppercase tracking-widest text-sm font-medium border-b border-stone-200 pb-4 inline-block">
                    {selectedImage.medium}
                  </p>
                </div>
                
                <p className="text-stone-700 leading-relaxed font-light text-lg">
                  {selectedImage.description}
                </p>
                
                <div className="pt-4">
                   <div className="flex flex-wrap gap-2">
                    {selectedImage.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-stone-200 text-stone-600 text-xs rounded-full">
                        #{tag}
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
