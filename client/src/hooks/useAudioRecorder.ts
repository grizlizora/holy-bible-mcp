import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  permissionError: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<File | null>;
  cancelRecording: () => void;
  clearPermissionError: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resolveFileRef = useRef<((file: File | null) => void) | null>(null);
  const recordingDurationRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    setRecordingDuration(0);
    recordingDurationRef.current = 0;
    timerIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const next = prev + 1;
        recordingDurationRef.current = next;
        return next;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const clearPermissionError = useCallback(() => {
    setPermissionError(null);
  }, []);

  // Cleanup tracks and timer on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopTimer]);

  const startRecording = useCallback(async (): Promise<boolean> => {
    setPermissionError(null);
    try {
      let stream = mediaStreamRef.current;
      // Отримуємо доступ до мікрофона лише якщо ще не маємо активного потоку
      if (!stream || stream.getTracks().every(t => t.readyState === 'ended')) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
      
      // Автоматичне визначення найкращого підтримуваного формату (Cross-browser: Chrome, Firefox, Safari)
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        // Stop tracks completely to release the microphone and remove the red dot
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        
        if (resolveFileRef.current) {
          if (audioChunksRef.current.length > 0) {
            const actualMime = recorder.mimeType || mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
            
            // Динамічне розширення файлу відповідно до фактичного формату
            let ext = 'webm';
            if (actualMime.includes('mp4') || actualMime.includes('aac')) ext = 'm4a';
            else if (actualMime.includes('ogg')) ext = 'ogg';
            else if (actualMime.includes('wav')) ext = 'wav';

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([audioBlob], `voice-message-${timestamp}.${ext}`, { type: audioBlob.type });
            (file as any).duration = recordingDurationRef.current;
            resolveFileRef.current(file);
          } else {
            resolveFileRef.current(null);
          }
          resolveFileRef.current = null;
        }
      };

      recorder.start(200); // збираємо фрагменти кожні 200 мс для стабільності
      setIsRecording(true);
      startTimer();
      return true;
      
    } catch (error: any) {
      const isDenied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
      const errorMessage = isDenied 
        ? 'Доступ до мікрофона відхилено користувачем або платформою.' 
        : 'Не вдалося отримати доступ до мікрофона.';

      console.warn('Мікрофон недоступний:', errorMessage);
      setPermissionError(errorMessage);
      setIsRecording(false);
      return false;
    }
  }, [startTimer, stopTimer]);

  const stopRecording = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        resolveFileRef.current = resolve;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        resolve(null);
      }
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      resolveFileRef.current = () => { /* Ігноруємо файл при скасуванні */ };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    isRecording,
    recordingDuration,
    permissionError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearPermissionError
  };
}
