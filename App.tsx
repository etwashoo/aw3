import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Gallery } from './components/Gallery';
import { AdminPanel } from './components/AdminPanel';
import { ViewMode, Artwork, RepoConfig } from './types';
import { fetchGalleryFromGitHub } from './services/githubService';

const CONFIG_KEY = 'museai_github_config';
const ARTIST_PASSWORD = 'muse';

// ----------------------------------------------------------------------
// ⚠️ PUBLIC CONFIGURATION ⚠️
// To make your gallery visible to visitors, you must update these values
// to match your GitHub repository details.
// ----------------------------------------------------------------------
const PUBLIC_REPO_CONFIG: RepoConfig = {
  owner: 'etwashoo',
  repo: 'aw3',
  branch: 'main',
};
// ----------------------------------------------------------------------

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GALLERY);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  
  // Initialize config with PUBLIC defaults, will be overridden by local storage if logged in
  const [repoConfig, setRepoConfig] = useState<RepoConfig>(PUBLIC_REPO_CONFIG);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load config from local storage (prioritizing local settings for Admin testing)
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setRepoConfig(prev => ({
            ...prev,
            // If local storage has values, use them, otherwise fallback to PUBLIC config
            owner: parsed.owner || PUBLIC_REPO_CONFIG.owner,
            repo: parsed.repo || PUBLIC_REPO_CONFIG.repo,
            branch: parsed.branch || PUBLIC_REPO_CONFIG.branch,
            token: parsed.token || '' 
        }));
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

  const isConfigured = repoConfig.owner && repoConfig.repo;

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-zinc-900 selection:text-white">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      
      <main className="flex-grow">
        {viewMode === ViewMode.GALLERY && (
          <>
             {!isConfigured ? (
                 <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
                    <div className="bg-zinc-50 border border-zinc-200 p-8 max-w-2xl">
                        <h2 className="text-xl font-serif text-zinc-900 mb-2">Setup Required</h2>
                        <p className="text-zinc-600 mb-6 font-light">
                            The gallery configuration is currently initializing.
                        </p>
                        <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                            <strong>Artist:</strong> Login to configure.<br/>
                            <strong>Developer:</strong> Update <code>PUBLIC_REPO_CONFIG</code> in <code>App.tsx</code>.
                        </p>
                        <button 
                            onClick={() => setViewMode(ViewMode.LOGIN)}
                            className="text-xs uppercase tracking-widest border-b border-zinc-900 pb-1 hover:opacity-50 transition-opacity"
                        >
                            Access Login
                        </button>
                    </div>
                 </div>
             ) : (
                 <>
                    {isLoadingData && artworks.length === 0 ? (
                        <div className="flex justify-center items-center h-[60vh]">
                            <div className="animate-pulse text-zinc-300 font-serif text-xl tracking-widest">LOADING COLLECTION</div>
                        </div>
                    ) : (
                        <Gallery artworks={artworks} />
                    )}
                 </>
             )}
          </>
        )}

        {viewMode === ViewMode.LOGIN && (
          <div className="flex items-center justify-center min-h-[70vh] px-4">
            <div className="w-full max-w-sm">
              <h2 className="text-3xl font-serif text-center mb-8 text-zinc-900">Artist Access</h2>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-0 py-2 border-b border-zinc-300 focus:border-zinc-900 outline-none bg-transparent placeholder-zinc-400 text-center font-light transition-colors"
                    placeholder="ENTER PASSWORD"
                    autoFocus
                  />
                </div>
                {loginError && <p className="text-red-900 text-xs text-center uppercase tracking-wide">{loginError}</p>}
                <button 
                  type="submit"
                  className="w-full py-4 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors text-xs uppercase tracking-[0.2em]"
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

      <footer className="bg-white text-zinc-900 py-16 border-t border-zinc-100 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 text-center">
          <p className="font-serif italic text-xl mb-6 text-zinc-900">"Art is not what you see, but what you make others see."</p>
          <div className="flex justify-center gap-8 mb-8">
             <span className="h-px w-8 bg-zinc-300 self-center"></span>
             <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">Est. 2024</span>
             <span className="h-px w-8 bg-zinc-300 self-center"></span>
          </div>
          <p className="text-[10px] tracking-widest text-zinc-300 uppercase">© Alexandra Galerie • Powered by Gemini</p>
        </div>
      </footer>
    </div>
  );
};

export default App;