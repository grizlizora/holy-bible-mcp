/**
 * Утиліти для роботи з медіафайлами на клієнті.
 */

/**
 * Асинхронно отримує тривалість аудіо або відео файлу в секундах.
 * Використовує нативні HTMLAudioElement / HTMLVideoElement браузера.
 * 
 * @param file Файл аудіо або відео
 * @returns Тривалість у секундах, або 0 якщо файл неможливо прочитати
 */
export async function getMediaDuration(file: File): Promise<number> {
  // Якщо файл вже має явну тривалість (напр. від нативного записатора useAudioRecorder)
  if ((file as any).duration && typeof (file as any).duration === 'number' && (file as any).duration > 0) {
    return (file as any).duration;
  }

  return new Promise((resolve) => {
    // Якщо файл не є аудіо чи відео, повертаємо 0
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      resolve(0);
      return;
    }

    const mediaElement = file.type.startsWith('video/') 
      ? document.createElement('video') 
      : document.createElement('audio');

    const objectUrl = URL.createObjectURL(file);

    mediaElement.onloadedmetadata = () => {
      // У випадку якщо тривалість Infinity (баг Chromium/Firefox для WebM записів з MediaRecorder),
      // вирушаємо в кінець треку для вирахування точного часу
      if (mediaElement.duration === Infinity || isNaN(mediaElement.duration)) {
        mediaElement.currentTime = 1e101;
        mediaElement.ontimeupdate = () => {
          mediaElement.ontimeupdate = null;
          const dur = Math.round(mediaElement.duration);
          URL.revokeObjectURL(objectUrl);
          resolve(isNaN(dur) || dur === Infinity ? 0 : dur);
        };
      } else {
        URL.revokeObjectURL(objectUrl);
        resolve(Math.round(mediaElement.duration));
      }
    };

    mediaElement.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };

    mediaElement.src = objectUrl;
  });
}

/**
 * Форматує тривалість у секундах у вигляд MM:SS або HH:MM:SS
 * 
 * @param seconds Секунди
 * @returns Форматований рядок (напр. "01:23")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  return `${hStr}${mStr}:${sStr}`;
}
