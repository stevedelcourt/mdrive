import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = process.env.DATA_DIR || './data';
const BASE_PATH = path.join(DATA_DIR, 'clients');

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (e) {
    // Exists
  }
}

async function ensureClientSpace(spaceId: string): Promise<void> {
  await ensureDir(BASE_PATH);
  await ensureDir(path.join(BASE_PATH, spaceId));
  await ensureDir(path.join(BASE_PATH, spaceId, 'files'));
}

export async function listClients(): Promise<string[]> {
  try {
    await ensureDir(BASE_PATH);
    const entries = await fs.readdir(BASE_PATH, { withFileTypes: true });
    return entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name);
  } catch (e) {
    return [];
  }
}

export async function getClientMeta(spaceId: string): Promise<{ name: string; password: string; createdAt: string; validatedFiles: string[] } | null> {
  const metaPath = path.join(BASE_PATH, spaceId, '.meta.json');
  
  try {
    const content = await fs.readFile(metaPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

export async function setClientMeta(spaceId: string, meta: { name: string; password: string; createdAt: string; validatedFiles: string[] }): Promise<void> {
  await ensureClientSpace(spaceId);
  const metaPath = path.join(BASE_PATH, spaceId, '.meta.json');
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
}

export async function listFiles(spaceId: string): Promise<any[]> {
  const filesDir = path.join(BASE_PATH, spaceId, 'files');
  
  try {
    const meta = await getClientMeta(spaceId);
    const validatedFiles = meta?.validatedFiles || [];
    
    await ensureDir(filesDir);
    const entries = await fs.readdir(filesDir, { withFileTypes: true });
    
    const files = [];
    for (const entry of entries) {
      if (entry.isFile()) {
        const stats = await fs.stat(path.join(filesDir, entry.name));
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        files.push({
          name: entry.name,
          path: `/api/files/${spaceId}/${entry.name}`,
          size: stats.size,
          type: getFileType(ext),
          extension: ext,
          isValidated: validatedFiles.includes(entry.name),
          uploadDate: stats.mtime.toISOString(),
        });
      }
    }
    return files;
  } catch (e) {
    return [];
  }
}

function getFileType(ext: string): 'image' | 'video' | 'pdf' | 'document' | 'other' {
  const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'psd', 'ai', 'svg', 'bmp', 'tiff', 'heic'];
  const videos = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'wmv'];
  const docs = ['pdf'];
  const documents = ['doc', 'docx', 'txt', 'md', 'rtf', 'odt'];
  
  if (images.includes(ext)) return 'image';
  if (videos.includes(ext)) return 'video';
  if (docs.includes(ext)) return 'pdf';
  if (documents.includes(ext)) return 'document';
  return 'other';
}

export async function uploadFile(spaceId: string, fileName: string, buffer: Buffer): Promise<void> {
  await ensureClientSpace(spaceId);
  const filePath = path.join(BASE_PATH, spaceId, 'files', fileName);
  await fs.writeFile(filePath, buffer);
}

export async function deleteFile(spaceId: string, fileName: string): Promise<void> {
  const filePath = path.join(BASE_PATH, spaceId, 'files', fileName);
  await fs.unlink(filePath);
}

export async function downloadFile(spaceId: string, fileName: string): Promise<Buffer> {
  const filePath = path.join(BASE_PATH, spaceId, 'files', fileName);
  return await fs.readFile(filePath);
}

export async function getNotes(spaceId: string): Promise<any[]> {
  const notesPath = path.join(BASE_PATH, spaceId, 'notes.json');
  
  try {
    const content = await fs.readFile(notesPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

export async function saveNotes(spaceId: string, notes: any[]): Promise<void> {
  await ensureClientSpace(spaceId);
  const notesPath = path.join(BASE_PATH, spaceId, 'notes.json');
  await fs.writeFile(notesPath, JSON.stringify(notes, null, 2));
}

export async function deleteClientSpace(spaceId: string): Promise<void> {
  const spacePath = path.join(BASE_PATH, spaceId);
  
  try {
    await fs.rm(spacePath, { recursive: true, force: true });
  } catch (e) {
    // Ignore
  }
}

export async function renameClientSpace(spaceId: string, newName: string): Promise<void> {
  const meta = await getClientMeta(spaceId);
  if (meta) {
    meta.name = newName;
    await setClientMeta(spaceId, meta);
  }
}

export async function validateFile(spaceId: string, fileName: string, validated: boolean): Promise<void> {
  const meta = await getClientMeta(spaceId);
  if (meta) {
    if (validated && !meta.validatedFiles.includes(fileName)) {
      meta.validatedFiles.push(fileName);
    } else if (!validated) {
      meta.validatedFiles = meta.validatedFiles.filter(f => f !== fileName);
    }
    await setClientMeta(spaceId, meta);
  }
}

export function getFileUrl(spaceId: string, fileName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/api/files/${spaceId}/${encodeURIComponent(fileName)}`;
}
