import React, { useState, useRef, useEffect } from 'react';
import { Artwork, RepoConfig } from '../types';
import { generateArtworkMetadata, fileToGenerativePart } from '../services/geminiService';
import { uploadImageToGitHub, updateGalleryManifest, verifyRepoAccess, getRepoDetails } from '../services/githubService';

interface AdminPanelProps {
  artworks: Artwork[];
  repoConfig: RepoConfig;
  onConfigChange: (config: RepoConfig) => void;
  onRefreshData: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  artworks, 
  repoConfig, 
  onConfigChange, 
  onRefreshData,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'settings'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [medium, setMedium] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [localConfig, setLocalConfig] = useState<RepoConfig>(repoConfig);
  const [isVerifying, setIsVerifying] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [repoWarning, setRepoWarning] = useState<string | null>(null);

  useEffect(() => {
    // If we don't have a token or repo configured, force the settings tab
    if (!repoConfig.owner || !repoConfig.repo || !repoConfig.token) {
      setActiveTab('settings');
    }
  }, [repoConfig]);

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

  const handlePublish = async () => {
    if (!file || !title) {
      setError("Please select an image and ensure a title is set.");
      return;
    }
    if (!repoConfig.token) {
        setError("GitHub Token is missing. Please check Settings.");
        return;
    }

    setIsUploading(true);
    setUploadStatus('Preparing...');
    
    try {
        const base64Data = await fileToGenerativePart(file);
        
        setUploadStatus('Uploading image to GitHub...');
        const imageUrl = await uploadImageToGitHub(file, base64Data, repoConfig);
        
        setUploadStatus('Updating gallery manifest...');
        const newArtwork: Artwork = {
            id: crypto.randomUUID(),
            imageUrl,
            title,
            description,
            medium,
            tags,
            createdAt: Date.now()
        };
        
        await updateGalleryManifest(newArtwork, repoConfig);
        
        setUploadStatus('Success!');
        onRefreshData();
        resetForm();
        setTimeout(() => {
            setIsUploading(false);
            setUploadStatus('');
        }, 1500);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to publish artwork");
        setIsUploading(false);
        setUploadStatus('');
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

  const saveSettings = async () => {
      setIsVerifying(true);
      setError(null);
      setRepoWarning(null);
      setConfigSuccess(false);
      try {
          const isValid = await verifyRepoAccess(localConfig);
          if (isValid) {
              // Check visibility
              const details = await getRepoDetails(localConfig);
              if (details && details.private) {
                setRepoWarning("Warning: This repository is set to PRIVATE. Images uploaded here will NOT be visible on the public website. Please change the repository visibility to Public in GitHub Settings.");
              }

              onConfigChange(localConfig);
              setConfigSuccess(true);
              if (!details?.private) {
                setTimeout(() => setActiveTab('upload'), 1000);
              }
          } else {
              setError("Could not access repository. Check Owner, Repo, and Token permissions.");
          }
      } catch (e) {
          setError("Verification failed.");
      } finally {
          setIsVerifying(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <div className="mb-4 md:mb-0">
           <h2 className="text-2xl font-serif text-stone-900">Curator Dashboard</h2>
           <p className="text-stone-500 text-sm mt-1">
               {repoConfig.owner && repoConfig.repo ? `Connected to ${repoConfig.owner}/${repoConfig.repo}` : 'Not connected to a repository'}
           </p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
            >
                Upload
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-stone-100 text-stone-900' : 'text-stone-500 hover:text-stone-900'}`}
            >
                Settings
            </button>
            <div className="h-6 w-px bg-stone-300 mx-2 self-center"></div>
            <button 
                onClick={onLogout}
                className="text-red-600 hover:text-red-800 text-sm font-medium self-center"
            >
                Log Out
            </button>
        </div>
      </div>

      {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-stone-200">
              <h3 className="text-xl font-medium text-stone-900 mb-6">Repository Configuration</h3>
              <p className="text-stone-500 text-sm mb-6 bg-stone-50 p-4 rounded">
                  Configure the GitHub repository where your gallery data and images will be stored. 
                  The repository must be <strong>Public</strong> for images to be visible on the website.
              </p>
              
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">GitHub Username</label>
                        <input 
                            type="text" 
                            value={localConfig.owner}
                            onChange={(e) => setLocalConfig({...localConfig, owner: e.target.value})}
                            className="w-full px-4 py-2 border border-stone-300 rounded outline-none focus:border-stone-500"
                            placeholder="e.g., octocat"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Repository Name</label>
                        <input 
                            type="text" 
                            value={localConfig.repo}
                            onChange={(e) => setLocalConfig({...localConfig, repo: e.target.value})}
                            className="w-full px-4 py-2 border border-stone-300 rounded outline-none focus:border-stone-500"
                            placeholder="e.g., my-art-gallery"
                        />
                      </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Branch</label>
                    <input 
                        type="text" 
                        value={localConfig.branch}
                        onChange={(e) => setLocalConfig({...localConfig, branch: e.target.value})}
                        className="w-full px-4 py-2 border border-stone-300 rounded outline-none focus:border-stone-500"
                        placeholder="main"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">GitHub Personal Access Token (Classic)</label>
                    <input 
                        type="password" 
                        value={localConfig.token || ''}
                        onChange={(e) => setLocalConfig({...localConfig, token: e.target.value})}
                        className="w-full px-4 py-2 border border-stone-300 rounded outline-none focus:border-stone-500"
                        placeholder="ghp_..."
                    />
                    <p className="text-xs text-stone-500 mt-1">
                        Token must have <code>repo</code> scope.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-100">
                      <button 
                        onClick={saveSettings}
                        disabled={isVerifying}
                        className={`w-full py-2 rounded font-medium text-white transition-colors ${configSuccess ? 'bg-green-600' : 'bg-stone-900 hover:bg-stone-800'}`}
                      >
                          {isVerifying ? 'Verifying...' : configSuccess ? 'Connected!' : 'Save Configuration'}
                      </button>
                      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                      {repoWarning && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                           <strong>Attention:</strong> {repoWarning}
                        </div>
                      )}
                  </div>
                  
                  {configSuccess && (
                     <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="text-blue-900 font-medium mb-2">🚀 Make Site Public</h4>
                        <p className="text-sm text-blue-800 mb-3">
                            To make the gallery visible to visitors who are not logged in, you must manually update 
                            the <code>App.tsx</code> file with your repository details.
                        </p>
                        <div className="bg-white p-3 rounded border border-blue-100 font-mono text-xs text-stone-600 overflow-x-auto">
                            const PUBLIC_REPO_CONFIG: RepoConfig = &#123;<br/>
                            &nbsp;&nbsp;owner: '{localConfig.owner}',<br/>
                            &nbsp;&nbsp;repo: '{localConfig.repo}',<br/>
                            &nbsp;&nbsp;branch: '{localConfig.branch}',<br/>
                            &#125;;
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                            Copy the code above and paste it into the <code>PUBLIC_REPO_CONFIG</code> section at the top of <strong>App.tsx</strong>.
                        </p>
                     </div>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'upload' && (
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
                            <p className="text-sm text-stone-500">JPG, PNG up to 5MB</p>
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
                    disabled={isAnalysing || isUploading}
                    className="w-full py-3 bg-stone-100 text-stone-900 border border-stone-200 font-medium rounded shadow-sm hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                    {isAnalysing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-stone-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Analysing with Gemini...
                        </>
                    ) : (
                        <>
                            <span>✨</span> Auto-Generate Metadata
                        </>
                    )}
                </button>
            )}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>

            {/* Right Col: Metadata Form */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 relative overflow-hidden">
                {isUploading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                         <svg className="animate-spin h-8 w-8 text-stone-900 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         <p className="text-stone-900 font-medium">{uploadStatus}</p>
                         <p className="text-stone-500 text-xs mt-2">Note: Public updates may take up to 5 mins to appear.</p>
                    </div>
                )}

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
                            onClick={handlePublish}
                            disabled={isUploading || !title}
                            className="w-full py-3 bg-stone-900 text-white font-serif tracking-wide rounded hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Publish to Gallery
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Existing Artworks List */}
      <div className="mt-16">
          <h3 className="text-xl font-serif text-stone-900 mb-6">Manage Collection ({artworks.length})</h3>
          <p className="text-stone-500 text-sm mb-4">Note: Deleting items from the UI currently requires manual removal from the JSON/Images on GitHub to fully sync.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {artworks.map(art => (
                  <div key={art.id} className="group relative border border-stone-200 rounded overflow-hidden">
                      <div className="aspect-square bg-stone-100 relative">
                          <img src={art.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={art.title} />
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