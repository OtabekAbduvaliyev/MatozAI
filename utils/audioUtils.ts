export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${m}:${remS.toString().padStart(2, '0')}`;
};

export const createAudioFile = (blob: Blob): File => {
  let ext = 'webm';
  // Strip codecs and other parameters (e.g. 'audio/webm;codecs=opus' -> 'audio/webm')
  let mime = blob.type.split(';')[0].trim(); 

  // Improve compatibility mapping
  if (mime === 'audio/mp4' || mime === 'audio/x-m4a') {
    ext = 'm4a';
    mime = 'audio/mp4'; 
  } else if (mime === 'audio/mpeg' || mime === 'audio/mp3') {
    ext = 'mp3';
    mime = 'audio/mpeg';
  } else if (mime === 'audio/wav' || mime === 'audio/x-wav') {
    ext = 'wav';
    mime = 'audio/wav';
  } else if (mime === 'audio/webm') {
    ext = 'webm';
    mime = 'audio/webm';
  } else {
    // Fallback for empty or unknown types
    ext = 'webm';
    mime = 'audio/webm';
  }
  
  const filename = `matozai-rec-${Date.now()}.${ext}`;
  // Important: Use the clean MIME type for the File constructor
  return new File([blob], filename, { type: mime, lastModified: Date.now() });
};

export const shareAudio = async (blob: Blob): Promise<boolean> => {
  try {
    const file = createAudioFile(blob);
    
    // Strict check for API support
    if (!navigator.share || !navigator.canShare) {
      return false;
    }

    const shareData = {
      files: [file],
      title: 'MatozAI Audio',
      text: 'MatozAI platformasi orqali yozilgan ovozli xabar.',
    };

    // Helper to check if data is shareable
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
    
    return false;
  } catch (error) {
    // "NotAllowedError" (Permission denied) usually happens if:
    // 1. User cancelled the share sheet.
    // 2. Browser policy blocked it (e.g. no user activation).
    // 3. File type not allowed.
    const errName = (error as any).name;
    if (errName !== 'AbortError' && errName !== 'NotAllowedError') {
      console.error('Share failed:', error);
    }
    
    // We return false to let the UI decide if it wants to show download fallback.
    return false;
  }
};

export const downloadAudio = (blob: Blob) => {
  const file = createAudioFile(blob);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};