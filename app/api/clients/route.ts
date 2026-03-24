import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, hashPassword } from '@/lib/auth';
import { listClients, getClientMeta, setClientMeta, deleteClientSpace } from '@/lib/storage';
import { ClientSpace } from '@/lib/types';

export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  
  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const clients = await listClients();
    const clientsWithMeta: ClientSpace[] = [];

    for (const clientId of clients) {
      const meta = await getClientMeta(clientId);
      if (meta) {
        clientsWithMeta.push({
          id: clientId,
          name: meta.name,
          password: '',
          createdAt: meta.createdAt,
          validatedFiles: meta.validatedFiles,
        });
      }
    }

    return NextResponse.json({ success: true, data: clientsWithMeta });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  
  if (!adminKey) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ success: false, error: 'Name and password required' }, { status: 400 });
    }

    const existingClients = await listClients();
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '_');
    let clientId = cleanName;
    
    let counter = 1;
    while (existingClients.includes(clientId)) {
      clientId = `${cleanName}_${counter}`;
      counter++;
    }

    const hashedPassword = await hashPassword(password);
    
    await setClientMeta(clientId, {
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      validatedFiles: [],
    });

    return NextResponse.json({ 
      success: true, 
      data: { id: clientId, name, createdAt: new Date().toISOString() } 
    });
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
    const { id, name, password } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Client ID required' }, { status: 400 });
    }

    const meta = await getClientMeta(id);
    if (!meta) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    if (name) meta.name = name;
    if (password) meta.password = await hashPassword(password);

    await setClientMeta(id, meta);

    return NextResponse.json({ success: true, data: { id, name: meta.name } });
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Client ID required' }, { status: 400 });
    }

    await deleteClientSpace(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
