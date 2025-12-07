import React, { useState, useRef } from 'react';
import { Artwork } from '../types';
import { generateArtworkMetadata, fileToGenerativePart } from '../services/geminiService';

interface AdminPanelProps {
  artworks: Artwork[];
  onAddArtwork: (art: Artwork) => void;
  onDeleteArtwork: (id: string) => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ artworks, onAddArtwork, onDeleteArtwork, onLogout }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Reset fields
      setTitle('');
      setDescription('');
      setMedium('');
      setTags([]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !previewUrl) return;

    setIsAnalysing(true);
    setError(null);

    try {
      const base64Data = await fileToGenerativePart(file);
      const metadata = await generateArtworkMetadata(base64Data, file.type);
      
      setTitle(metadata.title);
      setDescription(metadata.description);
      setMedium(metadata.medium);
      setTags(metadata.tags);
    } catch (err) {
      setError("Failed to analyze image. Ensure API Key is valid.");
      console.error(err);
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleSave = () => {
    if (!previewUrl || !title) {
      setError("Please select an image and ensure a title is set.");
      return;
    }

    setIsUploading(true);
    
    // In a real app, upload image to storage here.
    // We are using base64 for local demo persistence.
    const reader = new FileReader();
    reader.onload = () => {
       const newArtwork: Artwork = {
        id: crypto.randomUUID(),
        imageUrl: reader.result as string, // Saving full base64 for demo
        title,
        description,
        medium,
        tags,
        createdAt: Date.now()
      };
      
      onAddArtwork(newArtwork);
      resetForm();
      setIsUploading(false);
    };
    if (file) {
        reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setTitle('');
    setDescription('');
    setMedium('');
    setTags([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(artworks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "gallery-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <div>
           <h2 className="text-2xl font-serif text-stone-900">Curator Dashboard</h2>
           <p className="text-stone-500 text-sm mt-1">Upload new pieces and let AI curate the details.</p>
        </div>
        <div className="flex gap-4">
             <button 
                onClick={handleExport}
                className="text-stone-600 hover:text-stone-900 text-sm font-medium underline decoration-stone-300 underline-offset-4"
            >
                Export JSON
            </button>
            <button 
                onClick={onLogout}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
                Log Out
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Col: Upload & Preview */}
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors min-h-[300px] ${
                previewUrl ? 'border-stone-200 bg-stone-50' : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50 cursor-pointer'
            }`}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
             {previewUrl ? (
                 <div className="relative w-full h-full">
                     <img src={previewUrl} alt="Preview" className="max-h-[400px] mx-auto object-contain shadow-lg" />
                     <button 
                        onClick={(e) => { e.stopPropagation(); resetForm(); }}
                        className="absolute top-2 right-2 bg-white/80 p-2 rounded-full hover:bg-white text-stone-600 shadow-sm"
                     >
                         ✕
                     </button>
                 </div>
             ) : (
                 <div className="space-y-4">
                     <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                     </div>
                     <div>
                        <p className="text-lg font-medium text-stone-900">Click to upload artwork</p>
                        <p className="text-sm text-stone-500">JPG, PNG up to 10MB</p>
                     </div>
                 </div>
             )}
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
            />
          </div>

          {previewUrl && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalysing}
                className="w-full py-3 bg-stone-900 text-white font-medium rounded shadow hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                  {isAnalysing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analysing with Gemini...
                      </>
                  ) : (
                      <>
                        <span>✨</span> Generate Metadata
                      </>
                  )}
              </button>
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        {/* Right Col: Metadata Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-stone-200">
            <h3 className="text-lg font-medium text-stone-900 mb-6">Artwork Details</h3>
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-shadow"
                        placeholder="Untitled"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Medium</label>
                    <input 
                        type="text" 
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                        className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-shadow"
                        placeholder="e.g. Oil on Canvas"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Curatorial Description</label>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none transition-shadow"
                        placeholder="Generated description will appear here..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag, idx) => (
                            <span key={idx} className="bg-stone-100 text-stone-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                {tag}
                                <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:text-red-500">×</button>
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="pt-4 border-t border-stone-100">
                    <button 
                        onClick={handleSave}
                        disabled={isUploading || !title}
                        className="w-full py-3 bg-stone-900 text-white font-serif tracking-wide rounded hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isUploading ? 'Saving to Gallery...' : 'Publish to Gallery'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Existing Artworks List */}
      <div className="mt-16">
          <h3 className="text-xl font-serif text-stone-900 mb-6">Manage Collection ({artworks.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {artworks.map(art => (
                  <div key={art.id} className="group relative border border-stone-200 rounded overflow-hidden">
                      <div className="aspect-square bg-stone-100 relative">
                          <img src={art.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={art.title} />
                          <button 
                            onClick={() => onDeleteArtwork(art.id)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                      </div>
                      <div className="p-3 bg-white">
                          <p className="font-medium text-stone-900 truncate">{art.title}</p>
                          <p className="text-xs text-stone-500">{art.medium}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
