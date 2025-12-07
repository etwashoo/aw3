import { Artwork, RepoConfig } from '../types';

const BASE_URL = 'https://api.github.com';

// Helper for Unicode-safe Base64 encoding/decoding
const utf8_to_b64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const b64_to_utf8 = (str: string) => {
  return decodeURIComponent(escape(window.atob(str)));
};

export const getRepoDetails = async (config: RepoConfig) => {
  if (!config.token) return null;
  try {
    const response = await fetch(`${BASE_URL}/repos/${config.owner}/${config.repo}`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
};

export const fetchGalleryFromGitHub = async (config: RepoConfig): Promise<Artwork[]> => {
  if (!config.owner || !config.repo) return [];
  
  const branch = config.branch || 'main';

  // OPTION 1: authenticated API fetch (Immediate consistency, bypasses CDN cache)
  // We use this if a token is available so the artist sees their updates instantly.
  if (config.token) {
    try {
      const response = await fetch(`${BASE_URL}/repos/${config.owner}/${config.repo}/contents/gallery.json?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // GitHub API returns content in base64
        if (data.content) {
          const cleanContent = data.content.replace(/\n/g, '');
          const jsonString = b64_to_utf8(cleanContent);
          return JSON.parse(jsonString);
        }
      } else if (response.status === 404) {
        // File doesn't exist yet, return empty array
        return [];
      }
    } catch (e) {
      console.warn("API fetch failed, attempting fallback to Raw URL", e);
    }
  }

  // OPTION 2: Raw URL fetch (Public access, subject to caching)
  // This is what regular visitors use.
  const url = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${branch}/gallery.json?t=${Date.now()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("Error fetching gallery from GitHub:", error);
    return [];
  }
};

export const verifyRepoAccess = async (config: RepoConfig): Promise<boolean> => {
  if (!config.token) return false;
  try {
    const response = await fetch(`${BASE_URL}/repos/${config.owner}/${config.repo}`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const uploadImageToGitHub = async (
  file: File, 
  base64Content: string, 
  config: RepoConfig
): Promise<string> => {
  if (!config.token) throw new Error("Authentication required");

  // Clean filename to be URL safe
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '').toLowerCase();
  const path = `images/${Date.now()}-${cleanName}`;
  const branch = config.branch || 'main';

  const response = await fetch(`${BASE_URL}/repos/${config.owner}/${config.repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Upload artwork: ${cleanName}`,
      content: base64Content,
      branch: branch
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload image");
  }

  // Return the Raw URL
  // Note: For private repos, this URL is not publicly accessible
  return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${branch}/${path}`;
};

export const updateGalleryManifest = async (
  newArtwork: Artwork, 
  config: RepoConfig
): Promise<void> => {
  if (!config.token) throw new Error("Authentication required");
  
  const path = 'gallery.json';
  const branch = config.branch || 'main';
  const url = `${BASE_URL}/repos/${config.owner}/${config.repo}/contents/${path}`;

  // 1. Get current file (to get SHA and current list)
  let sha: string | undefined;
  let currentArtworks: Artwork[] = [];

  try {
    const getResponse = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getResponse.ok) {
      const data = await getResponse.json();
      sha = data.sha;
      if (data.content) {
        const cleanContent = data.content.replace(/\n/g, '');
        const jsonString = b64_to_utf8(cleanContent);
        currentArtworks = JSON.parse(jsonString);
      }
    }
  } catch (e) {
    console.log("Creating new gallery.json");
  }

  // 2. Prepend new artwork
  const updatedArtworks = [newArtwork, ...currentArtworks];

  // 3. Update file
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add artwork: ${newArtwork.title}`,
      content: utf8_to_b64(JSON.stringify(updatedArtworks, null, 2)),
      sha: sha,
      branch: branch
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update gallery manifest");
  }
};