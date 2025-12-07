import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Gallery } from './components/Gallery';
import { AdminPanel } from './components/AdminPanel';
import { ViewMode, Artwork } from './types';

const STORAGE_KEY = 'museai_gallery_data';

// Dummy data for initial load if storage is empty
const INITIAL_DATA: Artwork[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/800/1000',
    title: 'Ephemeral Morning',
    description: 'A striking composition that captures the delicate balance between light and shadow. The cool tones suggest a misty dawn, while the structured forms evoke a sense of urban solitude.',
    medium: 'Digital Photography',
    tags: ['minimalist', 'urban', 'blue', 'morning', 'architecture'],
    createdAt: Date.now()
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/800/600',
    title: 'Crimson Echoes',
    description: 'Vibrant strokes of red and orange dominate the canvas, creating a rhythmic energy that pulses through the scene. The abstraction invites the viewer to project their own emotions onto the chaotic beauty.',
    medium: 'Oil on Canvas',
    tags: ['abstract', 'red', 'vibrant', 'expressionism', 'oil'],
    createdAt: Date.now() - 10000
  },
  {
    id: '3',
    imageUrl: 'https://picsum.photos/600/800',
    title: 'Silent Observer',
    description: 'A contemplative portrait that uses high contrast to highlight the subject’s introspective gaze. The softness of the charcoal texture adds a layer of vulnerability to the strong composition.',
    medium: 'Charcoal on Paper',
    tags: ['portrait', 'monochrome', 'charcoal', 'contrast', 'emotion'],
    createdAt: Date.now() - 20000
  }
];

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GALLERY);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Load data from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setArtworks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved gallery", e);
        setArtworks(INITIAL_DATA);
      }
    } else {
      setArtworks(INITIAL_DATA);
    }
  }, []);

  // Save to local storage whenever artworks change
  useEffect(() => {
    if (artworks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
    }
  }, [artworks]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check for demo purposes
    if (password === 'admin') {
      setViewMode(ViewMode.ADMIN);
      setPassword('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const addArtwork = (newArt: Artwork) => {
    setArtworks(prev => [newArt, ...prev]);
  };

  const deleteArtwork = (id: string) => {
    if (window.confirm('Are you sure you want to delete this artwork?')) {
      setArtworks(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      
      <main className="flex-grow">
        {viewMode === ViewMode.GALLERY && (
          <Gallery artworks={artworks} />
        )}

        {viewMode === ViewMode.LOGIN && (
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border border-stone-100">
              <h2 className="text-2xl font-serif text-center mb-6 text-stone-900">Artist Access</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none"
                    placeholder="Enter 'admin'"
                    autoFocus
                  />
                </div>
                {loginError && <p className="text-red-500 text-sm">Incorrect password. Try 'admin'.</p>}
                <button 
                  type="submit"
                  className="w-full py-2 bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors"
                >
                  Enter Studio
                </button>
              </form>
            </div>
          </div>
        )}

        {viewMode === ViewMode.ADMIN && (
          <AdminPanel 
            artworks={artworks} 
            onAddArtwork={addArtwork}
            onDeleteArtwork={deleteArtwork}
            onLogout={() => setViewMode(ViewMode.GALLERY)}
          />
        )}
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-serif italic text-lg mb-4 text-stone-300">"Art is not what you see, but what you make others see."</p>
          <p className="text-sm tracking-wide">© {new Date().getFullYear()} Alexandra Studios. Powered by Gemini AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
