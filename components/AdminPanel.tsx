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
        
        setUploadStatus('Uploading to Archives...');
        const imageUrl = await uploadImageToGitHub(file, base64Data, repoConfig);
        
        setUploadStatus('Updating Catalogue...');
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
        
        setUploadStatus('Published Successfully');
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
                setRepoWarning("Repository is PRIVATE. Images will not be visible on public site.");
              }

              onConfigChange(localConfig);
              setConfigSuccess(true);
              if (!details?.private) {
                setTimeout(() => setActiveTab('upload'), 1000);
              }
          } else {
              setError("Access Denied. Verify Token scopes.");
          }
      } catch (e) {
          setError("Verification failed.");
      } finally {
          setIsVerifying(false);
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-zinc-100 pb-6">
        <div className="mb-4 md:mb-0">
           <h2 className="text-3xl font-serif text-zinc-900">Curator Dashboard</h2>
           <p className="text-zinc-400 text-xs uppercase tracking-widest mt-2">
               {repoConfig.owner && repoConfig.repo ? `Connected: ${repoConfig.owner} / ${repoConfig.repo}` : 'Not Connected'}
           </p>
        </div>
        <div className="flex gap-8">
            <button 
                onClick={() => setActiveTab('upload')}
                className={`pb-1 text-xs uppercase tracking-widest transition-colors ${activeTab === 'upload' ? 'border-b border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
            >
                Upload
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`pb-1 text-xs uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'border-b border-zinc-900 text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
            >
                Settings
            </button>
            <button 
                onClick={onLogout}
                className="pb-1 text-xs uppercase tracking-widest text-red-900/50 hover:text-red-900 transition-colors"
            >
                Log Out
            </button>
        </div>
      </div>

      {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-zinc-50 p-10 border border-zinc-100">
              <h3 className="text-lg font-serif text-zinc-900 mb-8">Repository Link</h3>
              
              <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">GitHub User</label>
                        <input 
                            type="text" 
                            value={localConfig.owner}
                            onChange={(e) => setLocalConfig({...localConfig, owner: e.target.value})}
                            className="w-full px-4 py-3 border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-colors text-sm"
                            placeholder="username"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Repository</label>
                        <input 
                            type="text" 
                            value={localConfig.repo}
                            onChange={(e) => setLocalConfig({...localConfig, repo: e.target.value})}
                            className="w-full px-4 py-3 border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-colors text-sm"
                            placeholder="repo-name"
                        />
                      </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Branch</label>
                    <input 
                        type="text" 
                        value={localConfig.branch}
                        onChange={(e) => setLocalConfig({...localConfig, branch: e.target.value})}
                        className="w-full px-4 py-3 border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-colors text-sm"
                        placeholder="main"
                    />
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wide text-zinc-500 mb-2">Access Token</label>
                    <input 
                        type="password" 
                        value={localConfig.token || ''}
                        onChange={(e) => setLocalConfig({...localConfig, token: e.target.value})}
                        className="w-full px-4 py-3 border border-zinc-200 bg-white focus:border-zinc-900 outline-none transition-colors text-sm"
                        placeholder="ghp_..."
                    />
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-200">
                      <button 
                        onClick={saveSettings}
                        disabled={isVerifying}
                        className={`w-full py-4 text-xs uppercase tracking-[0.2em] font-bold text-white transition-all ${configSuccess ? 'bg-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                      >
                          {isVerifying ? 'Verifying...' : configSuccess ? 'Link Established' : 'Save Configuration'}
                      </button>
                      {error && <p className="text-red-900 text-xs mt-3 text-center uppercase">{error}</p>}
                      {repoWarning && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 text-amber-900 text-xs">
                           <strong>NOTE:</strong> {repoWarning}
                        </div>
                      )}
                  </div>
                  
                  {configSuccess && (
                     <div className="mt-8 p-6 bg-white border border-zinc-200">
                        <h4 className="text-zinc-900 font-serif mb-2">Public Deployment Code</h4>
                        <p className="text-xs text-zinc-500 mb-3">
                            Update <code>App.tsx</code> with the following to enable public viewing:
                        </p>
                        <div className="bg-zinc-50 p-4 border border-zinc-100 font-mono text-xs text-zinc-600 overflow-x-auto">
                            const PUBLIC_REPO_CONFIG: RepoConfig = &#123;<br/>
                            &nbsp;&nbsp;owner: '{localConfig.owner}',<br/>
                            &nbsp;&nbsp;repo: '{localConfig.repo}',<br/>
                            &nbsp;&nbsp;branch: '{localConfig.branch}',<br/>
                            &#125;;
                        </div>
                     </div>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left Col: Upload & Preview */}
            <div className="space-y-6">
            <div 
                className={`border border-zinc-200 p-12 flex flex-col items-center justify-center text-center transition-all min-h-[400px] ${
                    previewUrl ? 'bg-white' : 'bg-zinc-50 hover:bg-zinc-100 cursor-pointer'
                }`}
                onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
                {previewUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={previewUrl} alt="Preview" className="max-h-[350px] object-contain shadow-sm" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); resetForm(); }}
                            className="absolute -top-4 -right-4 bg-zinc-900 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-700"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <span className="text-4xl text-zinc-300 font-serif italic">Upload</span>
                        <p className="text-xs uppercase tracking-widest text-zinc-400">Select Image File</p>
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
                    className="w-full py-4 bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-900 text-xs uppercase tracking-[0.2em] font-bold disabled:opacity-50 transition-all"
                >
                    {isAnalysing ? 'Analysing...' : 'Generate Metadata (Gemini)'}
                </button>
            )}
            {error && <p className="text-red-900 text-xs text-center uppercase tracking-wide">{error}</p>}
            </div>

            {/* Right Col: Metadata Form */}
            <div className="relative">
                {isUploading && (
                    <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center border border-zinc-100">
                         <div className="w-12 h-1 bg-zinc-900 animate-pulse mb-4"></div>
                         <p className="text-zinc-900 text-xs uppercase tracking-[0.2em]">{uploadStatus}</p>
                    </div>
                )}

                <h3 className="text-xl font-serif text-zinc-900 mb-8">Artwork Details</h3>
                <div className="space-y-8">
                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 group-focus-within:text-zinc-900 transition-colors">Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-0 py-2 border-b border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-transparent font-serif text-lg"
                            placeholder="..."
                        />
                    </div>
                    
                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 group-focus-within:text-zinc-900 transition-colors">Medium</label>
                        <input 
                            type="text" 
                            value={medium}
                            onChange={(e) => setMedium(e.target.value)}
                            className="w-full px-0 py-2 border-b border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-transparent font-light"
                            placeholder="..."
                        />
                    </div>

                    <div className="group">
                        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2 group-focus-within:text-zinc-900 transition-colors">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-4 bg-zinc-50 border border-zinc-100 focus:border-zinc-900 outline-none transition-colors font-light text-sm leading-relaxed"
                            placeholder="..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, idx) => (
                                <button key={idx} onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="border border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-400 px-3 py-1 text-[10px] uppercase tracking-widest transition-colors">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-8">
                        <button 
                            onClick={handlePublish}
                            disabled={isUploading || !title}
                            className="w-full py-4 bg-zinc-900 text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                        >
                            Publish to Gallery
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Existing Artworks List */}
      <div className="mt-24 pt-12 border-t border-zinc-100">
          <h3 className="text-lg font-serif text-zinc-900 mb-8">Catalogue Index</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {artworks.map(art => (
                  <div key={art.id} className="group cursor-pointer">
                      <div className="aspect-square bg-zinc-50 mb-3 overflow-hidden">
                          <img src={art.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={art.title} />
                      </div>
                      <p className="font-serif text-sm text-zinc-900 truncate group-hover:underline decoration-zinc-200 underline-offset-4">{art.title}</p>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};