import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Gallery } from './components/Gallery';
import { AdminPanel } from './components/AdminPanel';
import { ViewMode, Artwork, RepoConfig } from './types';
import { fetchGalleryFromGitHub } from './services/githubService';

const CONFIG_KEY = 'museai_github_config';
const ARTIST_PASSWORD = 'muse';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GALLERY);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [repoConfig, setRepoConfig] = useState<RepoConfig>({
    owner: '',
    repo: '',
    branch: 'main',
    token: ''
  });
  
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load config from local storage (including token for convenience)
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setRepoConfig({
            owner: parsed.owner || '',
            repo: parsed.repo || '',
            branch: parsed.branch || 'main',
            token: parsed.token || '' 
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch data when config changes (and has owner/repo)
  useEffect(() => {
    loadGalleryData();
  }, [repoConfig.owner, repoConfig.repo]);

  const loadGalleryData = async () => {
    if (repoConfig.owner && repoConfig.repo) {
        setIsLoadingData(true);
        const data = await fetchGalleryFromGitHub(repoConfig);
        if (data.length > 0) {
            setArtworks(data);
        }
        setIsLoadingData(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ARTIST_PASSWORD) {
      setViewMode(ViewMode.ADMIN);
      setPasswordInput('');
      setLoginError(null);
    } else {
      setLoginError('Incorrect password');
    }
  };

  const handleConfigUpdate = (newConfig: RepoConfig) => {
    setRepoConfig(newConfig);
    // Persist config including token so artist doesn't have to re-enter it
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      
      <main className="flex-grow">
        {viewMode === ViewMode.GALLERY && (
          <>
             {isLoadingData && artworks.length === 0 ? (
                 <div className="flex justify-center items-center h-64">
                     <div className="animate-pulse text-stone-400 font-serif">Loading Gallery...</div>
                 </div>
             ) : (
                <Gallery artworks={artworks} />
             )}
          </>
        )}

        {viewMode === ViewMode.LOGIN && (
          <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border border-stone-100">
              <h2 className="text-2xl font-serif text-center mb-2 text-stone-900">Artist Access</h2>
              <p className="text-center text-stone-500 text-sm mb-6">Enter the studio password to manage your collection.</p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-stone-500 focus:border-stone-500 outline-none"
                    placeholder="Enter password..."
                    autoFocus
                  />
                </div>
                {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
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
            repoConfig={repoConfig}
            onConfigChange={handleConfigUpdate}
            onRefreshData={loadGalleryData}
            onLogout={() => {
                setViewMode(ViewMode.GALLERY);
            }}
          />
        )}
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-serif italic text-lg mb-4 text-stone-300">"Art is not what you see, but what you make others see."</p>
          <p className="text-sm tracking-wide">© {new Date().getFullYear()} Alexandra Studios. Powered by Gemini AI & GitHub.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;