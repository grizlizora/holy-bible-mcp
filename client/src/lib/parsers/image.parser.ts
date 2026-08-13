import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Node.js 18+ compatibility polyfill for TensorFlow.js tfjs-node
const util = require('util');
if (!util.isNullOrUndefined) {
  util.isNullOrUndefined = (val: any) => val === null || val === undefined;
}

declare global {
  var cachedCocoModel: any;
}

export async function parseImage(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const tempId = uuidv4();
  const tempPath = path.join(os.tmpdir(), `temp_${tempId}.png`);

  try {
    // 0. Universal Image Normalization (HEIC to JPEG via heic-convert, others via Sharp)
    let normalizedBuffer: Buffer = buffer;
    if (ext === 'heic' || ext === 'heif' || mimeType.includes('heic') || mimeType.includes('heif')) {
      try {
        const convert = require('heic-convert');
        const outputBuffer = await convert({
          buffer: buffer,
          format: 'JPEG',
          quality: 0.9
        });
        normalizedBuffer = Buffer.from(outputBuffer);
      } catch (heicErr) {
        console.warn('HEIC conversion fallback:', heicErr);
      }
    } else {
      try {
        const sharp = require('sharp');
        normalizedBuffer = await sharp(buffer).toFormat('png').toBuffer();
      } catch (sharpErr) {
        // Fallback to original buffer
      }
    }

    // Write clean normalized PNG to temp file for Tesseract
    await fs.writeFile(tempPath, normalizedBuffer);

    let report = `[IMAGE ANALYSIS: ${filename}]\n\n`;

    // 1. EXIF Metadata (Only for JPEGs to avoid Invalid section offset errors)
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || ext === 'jpg' || ext === 'jpeg') {
      try {
        const exifParser = require('exif-parser');
        const parser = exifParser.create(buffer);
        const result = parser.parse();
        
        if (result && result.tags) {
          report += `--- EXIF METADATA ---\n`;
          if (result.tags.Make || result.tags.Model) {
            report += `- Camera/Device: ${result.tags.Make || ''} ${result.tags.Model || ''}\n`;
          }
          if (result.tags.DateTimeOriginal) {
            report += `- Date Taken: ${new Date(result.tags.DateTimeOriginal * 1000).toISOString()}\n`;
          }
          if (result.imageSize) {
            report += `- Resolution: ${result.imageSize.width}x${result.imageSize.height}\n\n`;
          }
        }
      } catch (e) {
        // Silently skip non-JPEG or missing EXIF
      }
    }

    // 2. OCR (Text Extraction) via Tesseract on normalized PNG
    try {
      const Tesseract = require('tesseract.js');
      const { data: { text, confidence } } = await Tesseract.recognize(
        tempPath,
        'ukr+eng', 
        { logger: (m: any) => {} }
      );

      if (text && text.trim().length > 0 && confidence > 35) {
        report += `--- EXTRACTED TEXT FROM IMAGE (OCR, Confidence: ${Math.round(confidence)}%) ---\n`;
        report += `${text.trim()}\n\n`;
      } else {
        report += `--- NO TEXT DETECTED ON IMAGE ---\n\n`;
      }
    } catch (e) {
      console.warn('OCR failed:', e);
    }

    // 3. Object Detection (COCO-SSD / TensorFlow) on normalized PNG
    try {
      const tf = require('@tensorflow/tfjs-node');
      const cocoSsd = require('@tensorflow-models/coco-ssd');
      
      if (!global.cachedCocoModel) {
        global.cachedCocoModel = await cocoSsd.load();
      }
      
      const imageTensor = tf.node.decodeImage(normalizedBuffer, 3);
      const predictions = await global.cachedCocoModel.detect(imageTensor);
      
      if (predictions && predictions.length > 0) {
        report += `--- DETECTED OBJECTS ON IMAGE (Computer Vision) ---\n`;
        const uniqueObjects = new Set();
        predictions.forEach((p: any) => {
          if (p.score > 0.5) uniqueObjects.add(p.class);
        });
        
        if (uniqueObjects.size > 0) {
          report += `- Objects: ${Array.from(uniqueObjects).join(', ')}\n\n`;
        } else {
          report += `- No distinct objects detected\n\n`;
        }
      }
      
      imageTensor.dispose();
    } catch (e) {
      console.warn('Object detection failed:', e);
    }

    return report;
  } catch (error) {
    console.error('Error parsing image:', error);
    return `[Error analyzing image ${filename}]`;
  } finally {
    try {
      await fs.unlink(tempPath);
    } catch (e) {}
  }
}
