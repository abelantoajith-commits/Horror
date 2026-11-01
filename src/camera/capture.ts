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
export async function composeShareableImage(
  photoDataUrl: string,
  caption: string,
  filterType: string = 'haunted'
): Promise<Blob | null> {
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

      // Special filter effects on canvas
      if (filterType === 'mustache') {
        // Draw vintage curved Kerala mustache
        ctx.save();
        ctx.fillStyle = '#110c08';
        ctx.beginPath();
        // Left curl
        ctx.moveTo(320, 245);
        ctx.bezierCurveTo(280, 230, 240, 220, 200, 238);
        ctx.bezierCurveTo(185, 245, 180, 258, 190, 268);
        ctx.bezierCurveTo(205, 275, 225, 265, 240, 252);
        ctx.bezierCurveTo(270, 240, 300, 248, 320, 256);
        // Right curl
        ctx.bezierCurveTo(340, 248, 370, 240, 400, 252);
        ctx.bezierCurveTo(415, 265, 435, 275, 450, 268);
        ctx.bezierCurveTo(460, 258, 455, 245, 440, 238);
        ctx.bezierCurveTo(400, 220, 360, 230, 320, 245);
        ctx.closePath();
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      } else if (filterType === 'white_hair') {
        // Draw spectral white hair locks
        ctx.save();
        ctx.strokeStyle = 'rgba(235, 240, 245, 0.75)';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#d3e7db';
        ctx.shadowBlur = 10;
        // Forehead & temple wisps
        for (let i = 0; i < 18; i++) {
          ctx.beginPath();
          const startX = 180 + i * 16;
          ctx.moveTo(startX, 50);
          ctx.bezierCurveTo(startX - 20, 110, startX + 25, 170, startX + (i < 9 ? -40 : 40), 230);
          ctx.stroke();
        }
        ctx.restore();
      } else if (filterType === 'bald') {
        // Draw ascetic bald dome blend
        ctx.save();
        const baldGrad = ctx.createRadialGradient(320, 100, 30, 320, 140, 180);
        baldGrad.addColorStop(0, 'rgba(55, 42, 32, 0.88)');
        baldGrad.addColorStop(0.6, 'rgba(35, 28, 22, 0.75)');
        baldGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = baldGrad;
        ctx.fillRect(80, 40, 480, 220);
        ctx.restore();
      } else if (filterType === 'fisheye') {
        // Draw convex circular fisheye optical ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(320, 220, 170, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(227, 194, 132, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        const fishGrad = ctx.createRadialGradient(320, 220, 100, 320, 220, 180);
        fishGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fishGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.35)');
        fishGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = fishGrad;
        ctx.fill();
        ctx.restore();
      }

      // Red horror vignette overlay
      const grad = ctx.createRadialGradient(320, 220, 60, 320, 220, 280);
      grad.addColorStop(0, 'rgba(120, 0, 0, 0.05)');
      grad.addColorStop(0.8, 'rgba(80, 0, 0, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(80, 40, 480, 360);

      // Antique brass / blood border
      ctx.strokeStyle = '#c5a66a';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 40, 480, 360);

      // Caption text
      ctx.fillStyle = '#e3c284';
      ctx.shadowColor = '#641e2b';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 22px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(caption, 320, 450);

      // Subtitle
      ctx.fillStyle = '#d9c1c2';
      ctx.shadowBlur = 0;
      ctx.font = '14px "Source Sans 3", sans-serif';
      ctx.fillText('NAGAVALLI — The Ancestral Manor Chronicle', 320, 490);

      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    };
    img.onerror = () => resolve(null);
    img.src = photoDataUrl;
  });
}

/**
 * Share or download the final game over card.
 */
export async function shareOrDownload(
  photoDataUrl: string,
  caption: string,
  filterType: string = 'haunted'
): Promise<void> {
  const blob = await composeShareableImage(photoDataUrl, caption, filterType);
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

