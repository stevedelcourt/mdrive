import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { listFiles, uploadFile, deleteFile, downloadFile, validateFile, getClientMeta } from '@/lib/storage';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');
  const fileName = searchParams.get('fileName');
  const action = searchParams.get('action');

  if (action === 'download' && spaceId && fileName) {
    try {
      const clientKey = request.headers.get('x-client-key');
      if (!clientKey || clientKey !== spaceId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const buffer = await downloadFile(spaceId, fileName);
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'md': 'text/markdown',
        'psd': 'image/vnd.adobe.photoshop',
        'ai': 'application/postscript',
      };

      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method === 'GET' && spaceId) {
    try {
      const files = await listFiles(spaceId);
      return NextResponse.json({ success: true, data: files });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const clientKey = request.headers.get('x-client-key');

  if (!adminKey && !clientKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const spaceId = formData.get('spaceId') as string;
    const file = formData.get('file') as File;

    if (!spaceId || !file) {
      return NextResponse.json({ success: false, error: 'Space ID and file required' }, { status: 400 });
    }

    if (clientKey && clientKey !== spaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (file.size > 1073741824) {
      return NextResponse.json({ success: false, error: 'File too large (max 1GB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(spaceId, file.name, buffer);

    return NextResponse.json({ success: true, data: { name: file.name, size: file.size } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  
  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { spaceId, fileName, action } = await request.json();

    if (!spaceId || !fileName || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    if (action === 'validate') {
      await validateFile(spaceId, fileName, true);
      return NextResponse.json({ success: true });
    }

    if (action === 'unvalidate') {
      await validateFile(spaceId, fileName, false);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  
  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    const fileName = searchParams.get('fileName');

    if (!spaceId || !fileName) {
      return NextResponse.json({ success: false, error: 'Space ID and file name required' }, { status: 400 });
    }

    await deleteFile(spaceId, fileName);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
