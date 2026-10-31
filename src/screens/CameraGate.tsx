import React, { useState } from 'react';
import { requestCameraStream } from '../camera/capture';

interface CameraGateProps {
  onStreamReady: (stream: MediaStream) => void;
}

export const CameraGate: React.FC<CameraGateProps> = ({ onStreamReady }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);
    try {
      const stream = await requestCameraStream();
      onStreamReady(stream);
    } catch (err: any) {
      console.warn('Camera request error:', err);
      setError(
        err?.message ||
          'Camera access was denied or no camera device was found. Camera permission is strictly required to play Nagavalli.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Mock stream generator for testing environments without webcam hardware
  const handleVirtualStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      let t = 0;
      const drawMock = () => {
        t += 0.05;
        ctx.fillStyle = '#110505';
        ctx.fillRect(0, 0, 320, 240);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(160 + Math.sin(t) * 20, 120 + Math.cos(t) * 10, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-gray-200 select-none">
      <div className="max-w-md w-full bg-[#0d0d12] border border-red-950/80 rounded-xl p-8 shadow-2xl shadow-red-950/40 text-center">
        <h1 className="text-4xl font-black tracking-widest text-red-600 mb-2 drop-shadow-[0_0_12px_rgba(220,38,38,0.7)] animate-flicker">
          NAGAVALLI
        </h1>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-6 font-semibold">
          Multiplayer Horror Hide &amp; Seek
        </p>

        <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-red-200/90 leading-relaxed">
            <span className="font-bold text-red-400">⚠️ Camera Requirement:</span> This game uses your camera. A photo of you will be taken during the game and shown to other players when you are caught or win.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-600/60 rounded-lg p-3 mb-6 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRequestPermission}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold rounded-lg transition-all tracking-wider shadow-lg shadow-red-900/50 disabled:opacity-50"
          >
            {loading ? 'Requesting Camera...' : 'ALLOW CAMERA TO ENTER'}
          </button>

          {error && (
            <button
              onClick={handleVirtualStream}
              className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-700 transition-all"
            >
              Use Virtual Test Stream (Dev / Headless Fallback)
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-600 mt-6">
          Photos are captured in memory only and transmitted via realtime broadcast to players in your room. No images are saved to any server.
        </p>
      </div>
    </div>
  );
};

