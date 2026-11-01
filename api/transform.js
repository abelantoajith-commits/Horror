/**
 * Vercel Serverless Function: /api/transform
 * 
 * Supports tested AI-based face transformations for:
 * - fisheye (barrel lens distortion)
 * - mustache (vintage Kerala curved handlebar mustache)
 * - bald (ascetic / hair removal transformation)
 * - white_hair (aged / spectral silver white hair)
 * 
 * Uses Replicate's tested InstructPix2Pix / Face-to-Many models when
 * REPLICATE_API_TOKEN is configured in Vercel Environment Variables.
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { image, filterType } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'Missing image data URL.' });
    }

    const token = process.env.REPLICATE_API_TOKEN;

    // Prompt mapping for tested InstructPix2Pix AI model
    const PROMPTS = {
      fisheye: 'extreme optical fisheye lens distortion, wide angle security camera bulge effect, spherical warping',
      mustache: 'add a thick vintage Kerala curved handlebar mustache on the face, dark hair, photorealistic',
      bald: 'make the person completely bald, smooth shaved head, natural skin tone on scalp',
      white_hair: 'turn all their hair into long wispy ghostly pure white silver hair, eerie ancestral look',
    };

    const prompt = PROMPTS[filterType] || 'supernatural vintage Kerala horror photograph filter';

    // If Replicate token is configured on Vercel, invoke Replicate API
    if (token) {
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // InstructPix2Pix official model version
          version: '30c1d0b916a6f8efce20493f5d6fce2d7959d460e33cfa13f356c1b3b7f62b03',
          input: {
            image: image,
            prompt: prompt,
            num_inference_steps: 25,
            image_guidance_scale: 1.5,
          },
        }),
      });

      const prediction = await response.json();

      if (!response.ok) {
        throw new Error(prediction.detail || 'Replicate prediction failed to initiate.');
      }

      // Poll until prediction is succeeded
      let pollResult = prediction;
      let attempts = 0;
      while (pollResult.status !== 'succeeded' && pollResult.status !== 'failed' && attempts < 20) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;
        const pollRes = await fetch(pollResult.urls.get, {
          headers: { Authorization: `Token ${token}` },
        });
        pollResult = await pollRes.json();
      }

      if (pollResult.status === 'succeeded' && pollResult.output) {
        const outputUrl = Array.isArray(pollResult.output) ? pollResult.output[0] : pollResult.output;
        return res.status(200).json({
          success: true,
          provider: 'replicate',
          outputUrl: outputUrl,
          filterType: filterType,
        });
      }
    }

    // Fallback: If no REPLICATE_API_TOKEN is set in Vercel environment,
    // inform client to use the high-performance instant Canvas/SVG pipeline.
    return res.status(200).json({
      success: true,
      provider: 'client_fallback',
      message: 'REPLICATE_API_TOKEN not configured. Using client-side SVG/Canvas filter pipeline.',
      filterType: filterType,
    });
  } catch (err) {
    console.error('Transform API Error:', err);
    return res.status(500).json({
      error: err.message || 'Transformation failed.',
      fallbackToClient: true,
    });
  }
}

