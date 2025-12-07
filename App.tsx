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
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Header viewMode={viewMode} setViewMode={setViewMode} />
      
      <main className="flex-grow">
        {viewMode === ViewMode.GALLERY && (
          <>
             {!isConfigured ? (
                 <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl">
                        <h2 className="text-xl font-serif text-yellow-800 mb-2">Setup Required</h2>
                        <p className="text-yellow-700 mb-4">
                            The gallery configuration is missing. 
                        </p>
                        <p className="text-sm text-yellow-800/80 mb-4">
                            <strong>If you are the Artist:</strong> Log in to the Admin Panel to configure your repository. 
                            <br/>
                            <strong>To make this public:</strong> You must update the <code>PUBLIC_REPO_CONFIG</code> in <code>App.tsx</code> with your GitHub username and repository name.
                        </p>
                        <button 
                            onClick={() => setViewMode(ViewMode.LOGIN)}
                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 px-4 py-2 rounded transition-colors text-sm font-medium"
                        >
                            Go to Login
                        </button>
                    </div>
                 </div>
             ) : (
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