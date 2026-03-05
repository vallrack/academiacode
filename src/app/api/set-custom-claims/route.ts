
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // CORRECTED: Check for the role that your system actually uses ('Super Admin')
    if (decodedToken.role !== 'Super Admin') {
      return NextResponse.json({ error: 'Forbidden. You must be a Super Admin to perform this action.' }, { status: 403 });
    }

    const { uid, role } = await req.json();
    if (!uid || !role) {
      return NextResponse.json({ error: 'UID and role are required' }, { status: 400 });
    }

    await adminAuth.setCustomUserClaims(uid, { role });

    return NextResponse.json({ success: true, message: `Custom claim '${role}' set for user ${uid}` });

  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
