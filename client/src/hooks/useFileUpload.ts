import { useState, useCallback } from 'react';
import { getMediaDuration } from '@/lib/media';

export interface Attachment {
  id: string;
  filename: string;
  type: string; // 'image' | 'file' | 'media'
  url: string;
  size: number;
  extractedText?: string;
  duration?: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  error?: string;
  xhr?: XMLHttpRequest;
}

export function useFileUpload() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // Use a map to track multiple uploads simultaneously
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = useCallback((file: File, isVoiceMessage: boolean = false): Promise<any> => {
    return new Promise((resolve, reject) => {
      const tempId = Math.random().toString(36).substring(7) + Date.now();
      
      const xhr = new XMLHttpRequest();

      setUploads(prev => {
        const next = new Map(prev);
        next.set(tempId, { file, progress: 0, xhr });
        return next;
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('isVoiceMessage', isVoiceMessage ? 'true' : 'false');
      
      getMediaDuration(file).then(duration => {
        if (duration > 0) {
          formData.append('duration', duration.toString());
        }
      }).catch(e => console.warn('Failed to get media duration:', e))
        .finally(() => {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploads(prev => {
                const next = new Map(prev);
                const current = next.get(tempId);
                if (current) {
                  next.set(tempId, { ...current, progress: percentComplete });
                }
                return next;
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                setAttachments(prev => [...prev, response]);
                
                setUploads(prev => {
                  const next = new Map(prev);
                  next.delete(tempId);
                  return next;
                });
                resolve(response);
              } catch (e) {
                setUploads(prev => {
                  const next = new Map(prev);
                  const current = next.get(tempId);
                  if (current) next.set(tempId, { ...current, progress: 0, error: 'Failed to parse response' });
                  return next;
                });
                reject(e);
              }
            } else {
              setUploads(prev => {
                const next = new Map(prev);
                const current = next.get(tempId);
                if (current) next.set(tempId, { ...current, progress: 0, error: 'Upload failed' });
                return next;
              });
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => {
            setUploads(prev => {
              const next = new Map(prev);
              const current = next.get(tempId);
              if (current) next.set(tempId, { ...current, progress: 0, error: 'Network error' });
              return next;
            });
            reject(new Error('Network error'));
          };

          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });
    });
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[], isVoiceMessage: boolean = false) => {
    const results = await Promise.allSettled(Array.from(files).map(file => uploadFile(file, isVoiceMessage)));
    return results
      .filter((r): r is PromiseFulfilledResult<Attachment> => r.status === 'fulfilled')
      .map(r => r.value);
  }, [uploadFile]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    // Optionally: Make an API call to delete the file from the server
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const cancelUpload = useCallback((tempId: string) => {
    setUploads(prev => {
      const next = new Map(prev);
      const current = next.get(tempId);
      if (current && current.xhr) {
        current.xhr.abort();
      }
      next.delete(tempId);
      return next;
    });
  }, []);

  return {
    attachments,
    uploads,
    handleFiles,
    removeAttachment,
    clearAttachments,
    cancelUpload
  };
}
