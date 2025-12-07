export interface Artwork {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  medium: string;
  tags: string[];
  createdAt: number;
}

export enum ViewMode {
  GALLERY = 'GALLERY',
  ADMIN = 'ADMIN',
  LOGIN = 'LOGIN'
}

export interface GeneratedMetadata {
  title: string;
  description: string;
  medium: string;
  tags: string[];
}

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}