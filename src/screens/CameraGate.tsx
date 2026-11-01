import React, { useState } from 'react';
import { requestCameraStream } from '../camera/capture';
import { soundManager } from '../audio/soundManager';

interface CameraGateProps {
  onStreamReady: (stream: MediaStream) => void;
}

export const CameraGate: React.FC<CameraGateProps> = ({ onStreamReady }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    soundManager.unlock();
    soundManager.startBgMusic();
    setLoading(true);
    setError(null);
    try {
      const stream = await requestCameraStream();
      onStreamReady(stream);
    } catch (err: any) {
      console.warn('Camera request error:', err);
      // In environments with no physical camera device (headless or testing), fall back seamlessly
      if (err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found')) {
        handleVirtualStream();
        return;
      }
      setError(
        err?.message ||
          'Camera access was denied or no camera device was detected. Camera permission is required for the live game-over capture.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Mock stream generator for testing environments without webcam hardware
  const handleVirtualStream = () => {
    soundManager.unlock();
    soundManager.startBgMusic();
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let t = 0;
      const drawMock = () => {
        t += 0.05;
        ctx.fillStyle = '#151411';
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#641e2b';
        ctx.beginPath();
        ctx.arc(160 + Math.sin(t) * 20, 120 + Math.cos(t) * 10, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e3c284';
        ctx.font = '12px "Source Sans 3", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VIRTUAL CAMERA TEST STREAM', 160, 200);
        requestAnimationFrame(drawMock);
      };
      drawMock();
    }
    const stream = canvas.captureStream(15);
    onStreamReady(stream);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#0e0e0b] text-[#e5e2dd] overflow-hidden select-none">
      {/* 2D Illustrated Kerala Tharavadu Entrance Background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter brightness-[0.45] contrast-[1.15] scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/thekkini_door.jpg')` }}
      />

      {/* Atmospheric Vignette, Fog & Warm Candlelight Pools */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Warm flickering amber glow near the lantern */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d99b51]/15 rounded-full blur-[140px] animate-pulse" />
        {/* Deep shadows and rain mist gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0b] via-[#0e0e0b]/75 to-[#0e0e0b]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#0e0e0b_90%)]" />
      </div>

      {/* Main Ancient Panel */}
      <div className="relative z-10 max-w-xl w-full my-8">
        {/* Decorative Ornate Antique Brass Corners */}
        <div className="absolute -top-3.5 -left-3.5 w-10 h-10 border-t-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -top-3.5 -right-3.5 w-10 h-10 border-t-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -left-3.5 w-10 h-10 border-b-2 border-l-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />
        <div className="absolute -bottom-3.5 -right-3.5 w-10 h-10 border-b-2 border-r-2 border-[#e3c284] z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(227,194,132,0.4)]" />

        {/* Carved Teak Wood Container */}
        <div className="bg-[#181714]/92 border border-[#e3c284]/35 rounded-xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-md text-center relative overflow-hidden">
          {/* Subtle antique brass inlay bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e3c284]/60 to-transparent" />

          {/* Heritage Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#201f1b] border border-[#e3c284]/30 shadow-inner mb-5">
            <span className="material-symbols-outlined text-[#e3c284] text-[18px]">
              temple_hindu
            </span>
            <span className="text-[11px] font-label-sm uppercase tracking-[0.2em] text-[#e3c284]">
              Padipura Gate • Ancestral Manor
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-headline-lg text-4xl sm:text-5xl text-[#e3c284] tracking-[0.15em] mb-2 drop-shadow-[0_2px_12px_rgba(227,194,132,0.3)]">
            NAGAVALLI
          </h1>
          <p className="font-body-md text-[#d9c1c2] italic mb-6 text-sm sm:text-base leading-relaxed">
            "Before unlatching the ancient carved doors, the tharavadu requires a glimpse of your mortal face."
          </p>

          {/* Antique Explanation Box */}
          <div className="bg-[#201f1b]/95 border border-[#e3c284]/25 rounded-lg p-5 mb-6 text-left relative overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#e3c284]" />
            <div className="flex items-start gap-3.5">
              <span className="material-symbols-outlined text-[#e3c284] text-2xl shrink-0 mt-0.5">
                photo_camera
              </span>
              <div className="space-y-2">
                <h4 className="font-headline-sm text-sm text-[#e3c284] tracking-wide">
                  Camera Access Protocol
                </h4>
                <p className="font-body-sm text-xs sm:text-sm text-[#e5e2dd]/90 leading-relaxed">
                  When you are claimed by Nagavalli or survive until the dawn bells chime, a single snapshot is captured in memory and shared with fellow investigators in your room for the final inquest photograph.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#b7cbbf]">
                  <span className="material-symbols-outlined text-sm text-[#b7cbbf]">shield</span>
                  <span>Photos are never uploaded to servers or stored on disk.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message if Denied */}
          {error && (
            <div className="bg-[#641e2b]/80 border border-[#ffb2ba]/40 rounded-lg p-3.5 mb-6 text-sm text-[#ffd9dc] flex items-center gap-2.5 text-left">
              <span className="material-symbols-outlined text-[#ffb2ba] text-xl shrink-0">
                warning
              </span>
              <span>{error}</span>
            </div>
          )}

          {/* Prominent Action Button */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRequestPermission}
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#d4b477] via-[#e3c284] to-[#d4b477] hover:brightness-110 active:scale-[0.98] text-[#3f0211] font-label-md tracking-widest uppercase font-bold rounded-lg shadow-[0_4px_25px_rgba(227,194,132,0.35)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">meeting_room</span>
              <span>{loading ? 'Unlatching the Gate...' : 'ENTER THE THARAVADU (ALLOW CAMERA)'}</span>
            </button>

            {error && (
              <button
                onClick={handleVirtualStream}
                className="w-full py-2.5 px-4 bg-[#201f1b] hover:bg-[#2a2924] text-[#e5e2dd] text-xs font-label-md rounded-lg border border-[#e3c284]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[#e3c284] text-sm">science</span>
                Use Virtual Stream (Dev / Headless Fallback)
              </button>
            )}
          </div>

          {/* Footer note */}
          <p className="font-body-sm text-[11px] text-[#d9c1c2]/60 mt-6 italic">
            Camera permission will be requested by your browser once you choose to enter.
          </p>
        </div>
      </div>
    </div>
  );
};
