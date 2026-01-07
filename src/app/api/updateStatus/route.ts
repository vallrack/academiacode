
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { status, lastSeen } = await req.json();

    if (!status || !lastSeen) {
        return NextResponse.json({ error: 'Status and lastSeen are required' }, { status: 400 });
    }

    const userStatusRef = db.collection('users').doc(userId);

    await userStatusRef.update({
      status: status,
      lastSeen: Timestamp.fromDate(new Date(lastSeen)),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
