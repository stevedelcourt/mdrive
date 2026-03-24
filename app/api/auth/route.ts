import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { getClientMeta } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { type, spaceId, password } = await request.json();

    if (type === 'admin') {
      const { username, password: adminPassword } = await request.json();
      const valid = verifyAdmin(username, adminPassword);
      
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      return NextResponse.json({ success: true, token: 'admin-session' });
    }

    if (type === 'client') {
      if (!spaceId || !password) {
        return NextResponse.json({ success: false, error: 'Space ID and password required' }, { status: 400 });
      }

      const meta = await getClientMeta(spaceId);
      
      if (!meta) {
        return NextResponse.json({ success: false, error: 'Client space not found' }, { status: 404 });
      }

      const bcrypt = require('bcryptjs');
      const valid = await bcrypt.compare(password, meta.password);

      if (!valid) {
        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
      }

      return NextResponse.json({ success: true, spaceId, spaceName: meta.name });
    }

    return NextResponse.json({ success: false, error: 'Invalid auth type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
