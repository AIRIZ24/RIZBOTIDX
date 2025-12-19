import React, { useState } from 'react';
import { generateMarketVideo } from '../services/geminiService';

const VeoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('A futuristic cinematic shot of a glowing bull statue in Jakarta, stock market graph going up in neon green lines, 4k, realistic.');
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    const url = await generateMarketVideo(prompt, aspect);
    setVideoUrl(url);
    setLoading(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Veo Market Studio
      </h2>
      <p className="text-slate-400 mb-6 text-sm">
        Generate professional market update videos or hype content using Gemini Veo 3.1.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none"
            placeholder="Describe the video..."
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="aspect" 
              checked={aspect === '16:9'} 
              onChange={() => setAspect('16:9')}
              className="text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-300">Landscape (16:9)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="aspect" 
              checked={aspect === '9:16'} 
              onChange={() => setAspect('9:16')}
              className="text-purple-600 focus:ring-purple-500"
            />
            <span className="text-slate-300">Portrait (9:16)</span>
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
            loading 
            ? 'bg-slate-700 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg shadow-purple-900/50'
          }`}
        >
          {loading ? 'Generating Video (This takes ~1-2 mins)...' : 'Generate Video'}
        </button>
      </div>

      {videoUrl && (
        <div className="mt-6">
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            loop 
            className="w-full rounded-lg border border-slate-600 shadow-2xl"
          />
          <a href={videoUrl} download="market_video.mp4" className="block text-center mt-2 text-purple-400 hover:text-purple-300 text-sm">
            Download Video
          </a>
        </div>
      )}
    </div>
  );
};

export default VeoStudio;