
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !fileName) {
      return NextResponse.json({ error: 'File and fileName are required' }, { status: 400 });
    }

    const bucket = adminStorage.bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const filePath = `screen-recordings/${fileName}`;
    const fileUpload = bucket.file(filePath);
    
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
      public: true, 
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json({ url: publicUrl });

  } catch (error: any)
{
    console.error('Error uploading file via API route:', error);
    return NextResponse.json({ error: 'Internal Server Error while uploading file.', details: error.message }, { status: 500 });
  }
}
