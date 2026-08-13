import { parseImage } from '../parsers/image.parser';
import { parseMedia } from '../parsers/media.parser';
import { parseDocument } from '../parsers/document.parser';

export default async function workerParser(args: { buffer: Uint8Array; type: string; name: string }) {
  const buffer = Buffer.from(args.buffer);
  
  if (args.type.startsWith('image/')) {
    return await parseImage(buffer, args.type, args.name);
  } else if (args.type.startsWith('video/') || args.type.startsWith('audio/')) {
    return await parseMedia(buffer, args.type, args.name);
  } else {
    return await parseDocument(buffer, args.type, args.name);
  }
}
