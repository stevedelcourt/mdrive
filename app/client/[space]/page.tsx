'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
  extension: string;
  isValidated: boolean;
  uploadDate: string;
}

interface Note {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  fileRef?: string;
  isValidated?: boolean;
}

export default function ClientSpacePage() {
  const router = useRouter();
  const params = useParams();
  const spaceId = params.space as string;

  const [clientName, setClientName] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [noteFileRef, setNoteFileRef] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clientKey = typeof window !== 'undefined' ? sessionStorage.getItem('clientSpace') : null;

  useEffect(() => {
    if (!clientKey || clientKey !== spaceId) {
      router.push('/');
      return;
    }

    const storedName = sessionStorage.getItem('clientName');
    if (storedName) setClientName(storedName);

    fetchData();
  }, [clientKey, spaceId, router]);

  const fetchData = async () => {
    try {
      const [filesRes, notesRes] = await Promise.all([
        fetch(`/api/files?spaceId=${spaceId}`, { headers: { 'x-client-key': spaceId } }),
        fetch(`/api/notes?spaceId=${spaceId}`, { headers: { 'x-client-key': spaceId } }),
      ]);

      const filesData = await filesRes.json();
      const notesData = await notesRes.json();

      if (filesData.success) setFiles(filesData.data);
      if (notesData.success) setNotes(notesData.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    const rawFiles = 'dataTransfer' in e ? e.dataTransfer.files : e.target.files;
    if (!rawFiles?.length) return;

    setUploading(true);
    const files = Array.from(rawFiles);
    for (const file of files) {
      const formData = new FormData();
      formData.append('spaceId', spaceId);
      formData.append('file', file);

      try {
        await fetch('/api/files', {
          method: 'POST',
          headers: { 'x-client-key': spaceId },
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed:', file.name);
      }
    }
    setUploading(false);
    fetchData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !noteAuthor.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-key': spaceId,
        },
        body: JSON.stringify({
          spaceId,
          text: newNote,
          author: noteAuthor,
          fileRef: noteFileRef || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotes([...notes, data.data]);
        setNewNote('');
        setNoteFileRef('');
      }
    } catch (err) {
      setError('Failed to add note');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('clientSpace');
    sessionStorage.removeItem('clientName');
    router.push('/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'pdf': return '📄';
      case 'document': return '📝';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#27272a] px-6 py-4 flex items-center justify-between bg-[#111111]">
        <div>
          <h1 className="text-xl font-bold">{clientName || 'Client Space'}</h1>
          <span className="text-sm text-gray-500">/{spaceId}</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white">
          Logout
        </button>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 p-6 border-r border-[#27272a]">
          <div className="mb-6">
            <div
              className={`dropzone p-8 text-center cursor-pointer rounded-lg ${dragOver ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e); }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              {uploading ? (
                <span className="text-gray-400">Uploading...</span>
              ) : (
                <span className="text-gray-400">
                  Drop files here to upload (max 1GB)
                </span>
              )}
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-4">Files</h2>
          {files.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-[#27272a] rounded-lg">
              No files shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {files.map(file => (
                <div
                  key={file.name}
                  className={`file-card bg-[#111111] border ${file.isValidated ? 'border-green-500' : 'border-[#27272a]'} rounded-lg overflow-hidden cursor-pointer relative`}
                  onClick={() => setPreviewFile(file)}
                >
                  {file.isValidated && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
                      ✓ Validated
                    </div>
                  )}
                  {file.type === 'image' ? (
                    <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center">
                      <img
                        src={`/api/files?spaceId=${spaceId}&fileName=${encodeURIComponent(file.name)}&action=download`}
                        alt={file.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center text-4xl">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-sm truncate" title={file.name}>{file.name}</p>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 p-6 bg-[#0a0a0a]">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>

          <form onSubmit={handleAddNote} className="space-y-3 mb-6">
            <input
              type="text"
              value={noteAuthor}
              onChange={e => setNoteAuthor(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6] text-sm"
              placeholder="Your name"
              required
            />
            <select
              value={noteFileRef}
              onChange={e => setNoteFileRef(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6] text-sm"
            >
              <option value="">General note</option>
              {files.map(file => (
                <option key={file.name} value={file.name}>{file.name}</option>
              ))}
            </select>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6] text-sm resize-none"
              placeholder="Type your note..."
              rows={3}
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-sm font-medium transition-colors"
            >
              Add Note
            </button>
          </form>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {notes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No notes yet.
              </div>
            ) : (
              [...notes].reverse().map(note => {
                const relatedFile = note.fileRef ? files.find(f => f.name === note.fileRef) : null;
                return (
                  <div key={note.id} className="bg-[#111111] border border-[#27272a] rounded-lg p-3 animate-fadeIn">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm">{note.author}</span>
                      <span className="text-xs text-gray-500">{formatDate(note.timestamp)}</span>
                    </div>
                    {note.fileRef && (
                      <div className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                        📎 {note.fileRef}
                        {note.isValidated && <span className="text-green-400">✓</span>}
                      </div>
                    )}
                    <p className="text-sm text-gray-300">{note.text}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8" onClick={() => setPreviewFile(null)}>
          <div className="max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">{previewFile.name}</h3>
                <p className="text-sm text-gray-400">{formatFileSize(previewFile.size)}</p>
              </div>
              <div className="flex gap-2">
                {previewFile.isValidated && (
                  <span className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
                    ✓ Validated
                  </span>
                )}
                <a
                  href={`/api/files?spaceId=${spaceId}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                  className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-sm"
                >
                  Download
                </a>
                <button onClick={() => setPreviewFile(null)} className="px-4 py-2 bg-[#1a1a1a] rounded-lg text-sm">Close</button>
              </div>
            </div>
            {previewFile.type === 'image' && (
              <img
                src={`/api/files?spaceId=${spaceId}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
            {previewFile.type === 'video' && (
              <video
                src={`/api/files?spaceId=${spaceId}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                controls
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            )}
            {previewFile.type === 'pdf' && (
              <iframe
                src={`/api/files?spaceId=${spaceId}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                className="w-full h-[70vh] rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
