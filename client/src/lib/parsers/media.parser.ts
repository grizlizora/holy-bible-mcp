import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { transcribeWithDaemon } from './whisper.daemon';
// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}


const KNOWN_HALLUCINATION_PATTERNS = [
  'продовження слідує',
  'дякую за перегляд',
  'дякую за увагу',
  'підпліг',
  'стоше',
  'субтитри',
  'редактор',
  'переклад',
  'бі, бі',
  'Бі, бі',
];

function sanitizeTranscribedText(text: string | null | undefined): string | null {
  if (!text) return null;
  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (clean.length < 2) return null;

  if (KNOWN_HALLUCINATION_PATTERNS.some(pat => lower.includes(pat.toLowerCase()) && clean.length < 60)) {
    return null;
  }

  return clean;
}

/**
 * Transcribes audio via OpenAI Cloud Whisper API if key is available
 */
async function transcribeCloudWhisper(filePath: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'local') return null;

  try {
    const fileBuffer = await fs.readFile(filePath);
    const blob = new Blob([fileBuffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'uk');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      console.log('[CLOUD WHISPER] Transcribed text:', data.text);
      return sanitizeTranscribedText(data.text || null);
    }
  } catch (e) {
    console.warn('[CLOUD WHISPER] API call failed:', e);
  }
  return null;
}


export async function parseMedia(inputPathOrBuffer: Buffer | string, mimeType: string, filename: string, isVoiceMessage: boolean = false): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() || 'mp3';
  const tempId = uuidv4();
  
  const isBuffer = Buffer.isBuffer(inputPathOrBuffer);
  const inputPath = isBuffer ? path.join(os.tmpdir(), `temp_in_${tempId}.${ext}`) : (inputPathOrBuffer as string);
  const outputPath = path.join(os.tmpdir(), `temp_out_${tempId}.wav`);

  try {
    // 1. Save original media to temp file if buffer
    if (isBuffer) {
      await fs.writeFile(inputPath, inputPathOrBuffer as Buffer);
    }

    let report = `[AUDIO/VIDEO ANALYSIS: ${filename}]\n\n`;

    // 1.5 Extract rich metadata using ffprobe
    try {
      const metadata = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });
      
      if (metadata && metadata.format) {
        const { duration, size, bit_rate, tags } = metadata.format;
        report += `--- METADATA ---\n`;
        if (duration) report += `Duration: ${Math.round(duration)}s\n`;
        if (size) report += `Size: ${(size / 1024 / 1024).toFixed(2)} MB\n`;
        if (bit_rate) report += `Bitrate: ${Math.round(bit_rate / 1000)} kbps\n`;
        
        if (tags) {
          if (tags.title) report += `Title: ${tags.title}\n`;
          if (tags.artist) report += `Artist: ${tags.artist}\n`;
          if (tags.creation_time) report += `Created: ${tags.creation_time}\n`;
        }

        // Add video/audio streams info
        const videoStream = metadata.streams?.find((s: any) => s.codec_type === 'video');
        if (videoStream) {
          report += `Video: ${videoStream.codec_name} ${videoStream.width}x${videoStream.height} (${videoStream.r_frame_rate} fps)\n`;
        }
        
        const audioStream = metadata.streams?.find((s: any) => s.codec_type === 'audio');
        if (audioStream) {
          report += `Audio: ${audioStream.codec_name} ${audioStream.sample_rate}Hz ${audioStream.channels}ch\n`;
        }
        report += `\n`;
      }
    } catch (probeErr) {
      console.warn('[FFPROBE] Failed to extract metadata:', probeErr);
    }

    // 2. Convert to 16kHz mono WAV — Whisper's required format
    // dynaudnorm: smart volume normalization (boosts quiet voice, leaves background noise untouched)
    let hasAudioTrack = true;
    try {
      await new Promise<void>((resolve) => {
        let command = ffmpeg(inputPath)
          .toFormat('wav')
          .audioChannels(1)
          .audioFrequency(16000)
          .audioFilters([
            'highpass=f=80',
            'lowpass=f=7600',
            'dynaudnorm=f=75:g=15',
          ])
          .on('error', (err: any) => {
            if (timeout) clearTimeout(timeout);
            console.warn('FFmpeg Audio Extraction Note:', err?.message || err);
            hasAudioTrack = false;
            resolve();
          })
          .on('end', () => {
            if (timeout) clearTimeout(timeout);
            resolve();
          });
          
        const timeout = setTimeout(() => {
          console.warn('FFmpeg conversion timeout - Killing zombie process');
          try { command.kill('SIGKILL'); } catch(e) {}
          hasAudioTrack = false;
          resolve();
        }, 30000); // 30 seconds max for FFmpeg

        command.save(outputPath);
      });
    } catch (ffmpegErr) {
      hasAudioTrack = false;
    }

    // Validate output file
    if (hasAudioTrack && existsSync(outputPath)) {
      const stats = await fs.stat(outputPath);
      console.log(`[FFMPEG] Converted audio size: ${stats.size} bytes`);
      if (stats.size <= 44) {
        hasAudioTrack = false;
      }
    } else {
      hasAudioTrack = false;
    }

    // 3. Dual-Engine Speech-To-Text
    if (hasAudioTrack) {
      try {
        let transcribedText: string | null = null;

        // Engine 1: Cloud Whisper API (fastest, best quality — if OpenAI key is set)
        transcribedText = await transcribeCloudWhisper(outputPath);

        // Engine 2: Local faster-whisper daemon (model stays warm in memory — no cold start)
        if (!transcribedText) {
          // Short audio (< 30s) = voice message mode: beam_size=1 greedy (fast)
          // Long audio = file mode: beam_size=5 (more accurate)
          const stats = await fs.stat(outputPath);
          const durationSec = Math.max(0, (stats.size - 44) / (16000 * 2)); // Calculate without loading into RAM
          const isShortAudio = durationSec < 30;
          const rawText = await transcribeWithDaemon(outputPath, isShortAudio, 60000);
          transcribedText = sanitizeTranscribedText(rawText);
        }

        if (transcribedText && transcribedText.trim().length > 0) {
          console.log(`✅ [MEDIA PARSER SUCCESS] Final text: "${transcribedText.trim()}"`);
          report += `--- TRANSCRIBED AUDIO SPEECH TEXT ---\n`;
          report += `${transcribedText.trim()}\n\n`;
        } else {
          console.log(`⚠️ [MEDIA PARSER NOTE] No clear speech recognized.`);
          report += `--- TRANSCRIBED AUDIO SPEECH TEXT ---\n`;
          report += `[Система: На аудіо/відео не розпізнано мови, лише фонові звуки]\n\n`;
        }

      } catch (e: any) {
        console.warn('Transcription error:', e?.message || e);
        report += `--- SPEECH TRANSCRIPTION ERROR ---\n\n`;
      }
    } else {
      report += `--- MEDIA FILE HAS NO AUDIO STREAM ---\n\n`;
    }

    return report;
  } catch (error) {
    console.error('Error parsing media:', error);
    return `[Error analyzing media file ${filename}]`;
  } finally {
    if (isBuffer) {
      try { if (existsSync(inputPath)) await fs.unlink(inputPath); } catch (e) {}
    }
    try { if (existsSync(outputPath)) await fs.unlink(outputPath); } catch (e) {}
  }
}
