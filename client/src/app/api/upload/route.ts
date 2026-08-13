import { NextResponse } from 'next/server';
import { parseDocument } from '@/lib/parsers/document.parser';
import { parseImage } from '@/lib/parsers/image.parser';
import { parseMedia } from '@/lib/parsers/media.parser';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Prepare uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename to prevent collisions
    const fileId = uuidv4();
    const ext = path.extname(file.name) || '';
    const safeFilename = `${fileId}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    // Save file physically via stream to prevent RAM bloat
    const { pipeline } = await import('stream/promises');
    await pipeline(file.stream() as any, fs.createWriteStream(filePath));
    
    // Universal Multimodal Parser Router
    let extractedText = '';
    try {
      if (file.type.startsWith('image/')) {
        const buffer = await fs.promises.readFile(filePath);
        extractedText = await parseImage(buffer, file.type, file.name);
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const isVoiceMessage = formData.get('isVoiceMessage') === 'true';
        extractedText = await parseMedia(filePath, file.type, file.name, isVoiceMessage);
      } else {
        const buffer = await fs.promises.readFile(filePath);
        extractedText = await parseDocument(buffer, file.type, file.name);
      }
    } catch (parseErr) {
      console.warn('Failed to parse file content:', parseErr);
    }

    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') || file.type.startsWith('video/') ? 'media' : 'file';
    const fileUrl = `/uploads/${safeFilename}`;
    const duration = formData.get('duration') ? Number(formData.get('duration')) : undefined;

    // Return the structure needed for the attachments table
    return NextResponse.json({ 
      id: fileId,
      filename: file.name,
      type: fileType,
      url: fileUrl,
      size: file.size,
      extractedText,
      duration,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
