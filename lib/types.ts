export interface ClientSpace {
  id: string;
  name: string;
  password: string;
  createdAt: string;
  validatedFiles: string[];
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
  extension: string;
  isValidated: boolean;
  uploadDate: string;
}

export interface Note {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  fileRef?: string;
  isValidated?: boolean;
}

export interface ClientMeta {
  name: string;
  password: string;
  createdAt: string;
  validatedFiles: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
