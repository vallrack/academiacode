
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // 1. Validar el token de autenticación del que hace la petición (el admin)
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // 2. Verificar que quien hace la petición es un SUPER_ADMIN
    if (decodedToken.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Obtener los datos para establecer el nuevo claim
    const { uid, role } = await req.json();
    if (!uid || !role) {
      return NextResponse.json({ error: 'UID and role are required' }, { status: 400 });
    }

    // 4. Establecer el custom claim
    await adminAuth.setCustomUserClaims(uid, { role });

    return NextResponse.json({ success: true, message: `Custom claim '${role}' set for user ${uid}` });

  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
        return NextResponse.json({ error: 'Invalid or expired admin token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
