import { NextRequest, NextResponse } from 'next/server';
import { getNotes, saveNotes } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');

  if (!spaceId) {
    return NextResponse.json({ success: false, error: 'Space ID required' }, { status: 400 });
  }

  try {
    const notes = await getNotes(spaceId);
    return NextResponse.json({ success: true, data: notes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  const clientKey = request.headers.get('x-client-key');

  if (!adminKey && !clientKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { spaceId, text, author, fileRef, isValidated } = await request.json();

    if (!spaceId || !text || !author) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (clientKey && clientKey !== spaceId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await getNotes(spaceId);
    
    const newNote = {
      id: uuidv4(),
      author,
      text,
      timestamp: new Date().toISOString(),
      fileRef: fileRef || null,
      isValidated: isValidated || false,
    };

    notes.push(newNote);
    await saveNotes(spaceId, notes);

    return NextResponse.json({ success: true, data: newNote });
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
    const { spaceId, noteId } = await request.json();

    if (!spaceId || !noteId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const notes = await getNotes(spaceId);
    const filtered = notes.filter((n: any) => n.id !== noteId);
    await saveNotes(spaceId, filtered);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
