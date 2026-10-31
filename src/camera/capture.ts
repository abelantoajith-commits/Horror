/**
 * Camera stream management, photo capture, fallback silhouette generation, and sharing.
 */

export async function requestCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Camera API (getUserMedia) not supported in this browser.');
  }
  return await navigator.mediaDevices.getUserMedia({
    video: { width: 320, height: 240, facingMode: 'user' },
    audio: false,
  });
}

/**
 * Capture a 320x240 JPEG photo from a video element (mirrored horizontally).
 */
export function capturePhoto(video: HTMLVideoElement): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return generateSilhouettePhoto();

    // Mirror horizontally for selfie orientation
    ctx.translate(320, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, 320, 240);

    return canvas.toDataURL('image/jpeg', 0.6);
  } catch (err) {
    console.error('Error capturing photo from video:', err);
    return generateSilhouettePhoto();
  }
}

/**
 * Fallback creepy silhouette photo if camera stream is missing or photo times out.
 */
export function generateSilhouettePhoto(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark background
  ctx.fillStyle = '#070709';
  ctx.fillRect(0, 0, 320, 240);

  // Red vignette
  const grad = ctx.createRadialGradient(160, 120, 20, 160, 120, 160);
  grad.addColorStop(0, 'rgba(136, 8, 8, 0.4)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 320, 240);

  // Draw shadow silhouette
  ctx.fillStyle = '#150505';
  ctx.beginPath();
  // Head
  ctx.arc(160, 90, 42, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.ellipse(160, 210, 85, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  // White glowing eyes
  ctx.fillStyle = '#ff2222';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(148, 88, 3, 0, Math.PI * 2);
  ctx.arc(172, 88, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  return canvas.toDataURL('image/jpeg', 0.6);
}

/**
 * Burn photo with horror overlay & caption into a downloadable canvas / blob.
 */
export async function composeShareableImage(photoDataUrl: string, caption: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Dark background
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw photo centered
      ctx.drawImage(img, 80, 40, 480, 360);

      // Red horror vignette overlay
      const grad = ctx.createRadialGradient(320, 220, 60, 320, 220, 280);
      grad.addColorStop(0, 'rgba(120, 0, 0, 0.1)');
      grad.addColorStop(0.8, 'rgba(80, 0, 0, 0.5)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(80, 40, 480, 360);

      // Blood red border
      ctx.strokeStyle = '#880808';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 40, 480, 360);

      // Caption text
      ctx.fillStyle = '#ff2222';
      ctx.shadowColor = '#880808';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(caption, 320, 450);

      // Subtitle
      ctx.fillStyle = '#9ca3af';
      ctx.shadowBlur = 0;
      ctx.font = '14px monospace';
      ctx.fillText('NAGAVALLI — Multiplayer Horror Hide & Seek', 320, 490);

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    };
    img.onerror = () => resolve(null);
    img.src = photoDataUrl;
  });
}

/**
 * Share or download the final game over card.
 */
export async function shareOrDownload(photoDataUrl: string, caption: string): Promise<void> {
  const blob = await composeShareableImage(photoDataUrl, caption);
  if (!blob) return;

  const fileName = `nagavalli-${Date.now()}.jpg`;
  const file = new File([blob], fileName, { type: 'image/jpeg' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'NAGAVALLI Horror Result',
        text: caption,
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Web Share failed, falling back to download', err);
    }
  }

  // Fallback download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

