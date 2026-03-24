import Client from 'ssh2-sftp-client';
import { promises as fs } from 'fs';
import path from 'path';

const sftpConfig = {
  host: process.env.SFTP_HOST,
  port: parseInt(process.env.SFTP_PORT || '22'),
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASSWORD,
};

const BASE_PATH = process.env.SFTP_BASE_PATH || '/clients';

let cachedClient: Client | null = null;

async function getClient(): Promise<Client> {
  if (cachedClient && (cachedClient as any).sftp) {
    return cachedClient;
  }
  
  const client = new Client();
  await client.connect(sftpConfig);
  cachedClient = client;
  
  try {
    await client.mkdir(BASE_PATH);
  } catch (e) {
    // Directory exists, ignore
  }
  
  return client;
}

export async function ensureClientSpace(spaceId: string): Promise<void> {
  const client = await getClient();
  const spacePath = `${BASE_PATH}/${spaceId}`;
  
  try {
    await client.mkdir(spacePath);
  } catch (e) {
    // Directory exists
  }
  
  try {
    await client.mkdir(`${spacePath}/files`);
  } catch (e) {
    // Directory exists
  }
}

export async function listClients(): Promise<string[]> {
  const client = await getClient();
  try {
    const list = await client.list(BASE_PATH);
    return list
      .filter(item => item.type === 'd' && !item.name.startsWith('.'))
      .map(item => item.name);
  } catch (e) {
    return [];
  }
}

export async function getClientMeta(spaceId: string): Promise<{ name: string; password: string; createdAt: string; validatedFiles: string[] } | null> {
  const client = await getClient();
  const metaPath = `${BASE_PATH}/${spaceId}/.meta.json`;
  
  try {
    const content = await client.get(metaPath);
    return JSON.parse(content.toString());
  } catch (e) {
    return null;
  }
}

export async function setClientMeta(spaceId: string, meta: { name: string; password: string; createdAt: string; validatedFiles: string[] }): Promise<void> {
  await ensureClientSpace(spaceId);
  const client = await getClient();
  const metaPath = `${BASE_PATH}/${spaceId}/.meta.json`;
  
  await client.put(Buffer.from(JSON.stringify(meta, null, 2)), metaPath);
}

export async function listFiles(spaceId: string): Promise<any[]> {
  const client = await getClient();
  const filesPath = `${BASE_PATH}/${spaceId}/files`;
  
  try {
    const meta = await getClientMeta(spaceId);
    const validatedFiles = meta?.validatedFiles || [];
    
    const list = await client.list(filesPath);
    return list
      .filter(item => item.type === '-')
      .map(item => {
        const ext = path.extname(item.name).toLowerCase().slice(1);
        return {
          name: item.name,
          path: `/api/files/${spaceId}/${item.name}`,
          size: item.size,
          type: getFileType(ext),
          extension: ext,
          isValidated: validatedFiles.includes(item.name),
          uploadDate: item.modifyTime ? new Date(item.modifyTime).toISOString() : new Date().toISOString(),
        };
      });
  } catch (e) {
    return [];
  }
}

function getFileType(ext: string): 'image' | 'video' | 'pdf' | 'document' | 'other' {
  const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'psd', 'ai', 'svg', 'bmp', 'tiff'];
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
  const client = await getClient();
  const filePath = `${BASE_PATH}/${spaceId}/files/${fileName}`;
  
  await client.put(buffer, filePath);
}

export async function deleteFile(spaceId: string, fileName: string): Promise<void> {
  const client = await getClient();
  const filePath = `${BASE_PATH}/${spaceId}/files/${fileName}`;
  
  await client.delete(filePath);
}

export async function downloadFile(spaceId: string, fileName: string): Promise<Buffer> {
  const client = await getClient();
  const filePath = `${BASE_PATH}/${spaceId}/files/${fileName}`;
  
  return await client.get(filePath);
}

export async function getNotes(spaceId: string): Promise<any[]> {
  const client = await getClient();
  const notesPath = `${BASE_PATH}/${spaceId}/notes.json`;
  
  try {
    const content = await client.get(notesPath);
    return JSON.parse(content.toString());
  } catch (e) {
    return [];
  }
}

export async function saveNotes(spaceId: string, notes: any[]): Promise<void> {
  await ensureClientSpace(spaceId);
  const client = await getClient();
  const notesPath = `${BASE_PATH}/${spaceId}/notes.json`;
  
  await client.put(Buffer.from(JSON.stringify(notes, null, 2)), notesPath);
}

export async function deleteClientSpace(spaceId: string): Promise<void> {
  const client = await getClient();
  const spacePath = `${BASE_PATH}/${spaceId}`;
  
  try {
    await client.rmdir(spacePath, true);
  } catch (e) {
    // Directory doesn't exist or can't be deleted
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:4096';
  return `${baseUrl}/api/files/${spaceId}/${encodeURIComponent(fileName)}`;
}
