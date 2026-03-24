'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  name: string;
  createdAt: string;
  validatedFiles: string[];
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'pdf' | 'document' | 'other';
  extension: string;
  isValidated: boolean;
  uploadDate: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', password: '' });
  const [editForm, setEditForm] = useState({ name: '', password: '' });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (!adminKey) {
      router.push('/');
      return;
    }
    fetchClients();
  }, [adminKey, router]);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', { headers: { 'x-admin-key': adminKey || '' } });
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (clientId: string) => {
    try {
      const res = await fetch(`/api/files?spaceId=${clientId}`, { headers: { 'x-admin-key': adminKey || '' } });
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (err) {
      setError('Failed to fetch files');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || '' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setClients([...clients, data.data]);
        setShowCreateModal(false);
        setCreateForm({ name: '', password: '' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create client');
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || '' },
        body: JSON.stringify({ id: selectedClient.id, name: editForm.name, password: editForm.password }),
      });
      const data = await res.json();
      if (data.success) {
        setClients(clients.map(c => c.id === selectedClient.id ? { ...c, name: data.data.name } : c));
        if (selectedClient) setSelectedClient({ ...selectedClient, name: data.data.name });
        setShowEditModal(false);
        setEditForm({ name: '', password: '' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Delete this client space? All files will be lost!')) return;
    try {
      await fetch(`/api/clients?id=${clientId}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey || '' } });
      setClients(clients.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
        setFiles([]);
      }
    } catch (err) {
      setError('Failed to delete client');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    if (!selectedClient) return;
    const fileList = 'dataTransfer' in e ? e.dataTransfer.files : e.target.files;
    if (!fileList?.length) return;

    setUploading(true);
    const files = Array.from(fileList);
    for (const file of files) {
      const formData = new FormData();
      formData.append('spaceId', selectedClient.id);
      formData.append('file', file);

      try {
        await fetch('/api/files', {
          method: 'POST',
          headers: { 'x-admin-key': adminKey || '' },
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed:', file.name);
      }
    }
    setUploading(false);
    fetchFiles(selectedClient.id);
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!selectedClient || !confirm(`Delete ${fileName}?`)) return;
    try {
      await fetch(`/api/files?spaceId=${selectedClient.id}&fileName=${fileName}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey || '' },
      });
      setFiles(files.filter(f => f.name !== fileName));
    } catch (err) {
      setError('Failed to delete file');
    }
  };

  const handleValidate = async (file: FileInfo) => {
    if (!selectedClient) return;
    try {
      const action = file.isValidated ? 'unvalidate' : 'validate';
      await fetch('/api/files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey || '' },
        body: JSON.stringify({ spaceId: selectedClient.id, fileName: file.name, action }),
      });
      setFiles(files.map(f => f.name === file.name ? { ...f, isValidated: !f.isValidated } : f));
    } catch (err) {
      setError('Failed to update validation');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    router.push('/');
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setEditForm({ name: client.name, password: '' });
    fetchFiles(client.id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
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
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          {selectedClient && (
            <button
              onClick={() => { setSelectedClient(null); setFiles([]); }}
              className="text-sm text-gray-400 hover:text-white"
            >
              ← All Clients
            </button>
          )}
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

      <main className="flex-1 p-6">
        {!selectedClient ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Client Spaces</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-sm font-medium transition-colors"
              >
                + New Client
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No client spaces yet. Create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map(client => (
                  <div
                    key={client.id}
                    className="bg-[#111111] border border-[#27272a] rounded-lg p-4 hover:border-[#3b82f6] transition-colors cursor-pointer"
                    onClick={() => selectClient(client)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium">{client.name}</h3>
                      <span className="text-xs text-gray-500">/{client.id}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowEditModal(true); selectClient(client); }}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#1a1a1a]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-[#1a1a1a]"
                      >
                        Delete
                      </button>
                      <a
                        href={`/client/${client.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-[#1a1a1a]"
                      >
                        View ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">{selectedClient.name}</h2>
                <span className="text-sm text-gray-500">/{selectedClient.id}</span>
              </div>
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
                    Drop files here or click to upload (max 1GB)
                  </span>
                )}
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-dashed border-[#27272a] rounded-lg">
                No files yet. Upload some to get started.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {files.map(file => (
                  <div
                    key={file.name}
                    className={`file-card bg-[#111111] border ${file.isValidated ? 'border-green-500' : 'border-[#27272a]'} rounded-lg overflow-hidden cursor-pointer`}
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.type === 'image' ? (
                      <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center">
                        <img
                          src={`/api/files?spaceId=${selectedClient.id}&fileName=${encodeURIComponent(file.name)}&action=download`}
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
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleValidate(file); }}
                            className={`text-xs px-1.5 py-0.5 rounded ${file.isValidated ? 'bg-green-500/20 text-green-400' : 'bg-[#1a1a1a] text-gray-400'}`}
                            title={file.isValidated ? 'Validated' : 'Mark as validated'}
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }}
                            className="text-xs px-1.5 py-0.5 rounded bg-[#1a1a1a] text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#111111] border border-[#27272a] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Create Client Space</h3>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="Ecolearn"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="Client's password"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 bg-[#1a1a1a] rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#3b82f6] rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#111111] border border-[#27272a] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Client: {selectedClient.name}</h3>
            <form onSubmit={handleEditClient} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">New Password (leave empty to keep)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#27272a] rounded-lg focus:outline-none focus:border-[#3b82f6]"
                  placeholder="New password"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-[#1a1a1a] rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#3b82f6] rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8" onClick={() => setPreviewFile(null)}>
          <div className="max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">{previewFile.name}</h3>
                <p className="text-sm text-gray-400">{formatFileSize(previewFile.size)}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/files?spaceId=${selectedClient?.id}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                  className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-sm"
                >
                  Download
                </a>
                <button onClick={() => setPreviewFile(null)} className="px-4 py-2 bg-[#1a1a1a] rounded-lg text-sm">Close</button>
              </div>
            </div>
            {previewFile.type === 'image' && (
              <img
                src={`/api/files?spaceId=${selectedClient?.id}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
            {previewFile.type === 'video' && (
              <video
                src={`/api/files?spaceId=${selectedClient?.id}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                controls
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            )}
            {previewFile.type === 'pdf' && (
              <iframe
                src={`/api/files?spaceId=${selectedClient?.id}&fileName=${encodeURIComponent(previewFile.name)}&action=download`}
                className="w-full h-[70vh] rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
