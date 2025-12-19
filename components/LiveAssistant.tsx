import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { arrayBufferToBase64, LIVE_SYSTEM_INSTRUCTION } from '../services/geminiService';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const LiveAssistant: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [statusText, setStatusText] = useState("Siap Memulai");
  const [logs, setLogs] = useState<{message: string; type: 'info' | 'success' | 'error'}[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const sessionRef = useRef<any>(null);

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-6), { message: `[${timestamp}] ${msg}`, type }]);
  }, []);

  // Audio level monitoring
  useEffect(() => {
    if (!active || !analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);
      animationRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active]);

  const startSession = useCallback(async () => {
    try {
      setStatus('connecting');
      setStatusText("Menghubungkan ke RIZBOT...");
      addLog("Memulai koneksi...", 'info');
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }, 
        video: false 
      });
      streamRef.current = stream;
      addLog("Mikrofon terhubung", 'success');

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      // Create analyser for visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64Data = arrayBufferToBase64(pcmData.buffer);
        
        sessionRef.current.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Data
          }
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      let nextStartTime = 0;

      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: LIVE_SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            setStatus('connected');
            setStatusText("RIZBOT Live - Siap Diskusi");
            addLog("Sesi dimulai - Mulai berbicara!", 'success');
            setActive(true);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const binaryString = atob(audioData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
              
              const int16Data = new Int16Array(bytes.buffer);
              const float32Data = new Float32Array(int16Data.length);
              for(let i = 0; i < int16Data.length; i++) {
                float32Data[i] = int16Data[i] / 32768.0;
              }

              const buffer = outputCtx.createBuffer(1, float32Data.length, 24000);
              buffer.getChannelData(0).set(float32Data);

              const src = outputCtx.createBufferSource();
              src.buffer = buffer;
              src.connect(outputCtx.destination);
              
              const now = outputCtx.currentTime;
              const start = Math.max(now, nextStartTime);
              src.start(start);
              nextStartTime = start + buffer.duration;
            }
          },
          onclose: () => {
            setStatus('disconnected');
            setStatusText("Sesi Berakhir");
            setActive(false);
            addLog("Koneksi ditutup", 'info');
          },
          onerror: (err) => {
            console.error(err);
            setStatus('error');
            setStatusText("Error Koneksi");
            addLog("Terjadi error koneksi", 'error');
          }
        }
      });

      sessionRef.current = session;

    } catch (e) {
      console.error(e);
      setStatus('error');
      setStatusText("Gagal Menghubungkan");
      addLog("Gagal: Periksa izin mikrofon atau API Key", 'error');
    }
  }, [addLog]);

  const stopSession = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    sessionRef.current = null;
    analyserRef.current = null;
    setActive(false);
    setStatus('disconnected');
    setStatusText("Sesi Dihentikan");
    setAudioLevel(0);
    addLog("Sesi dihentikan", 'info');
  }, [addLog]);

  return (
    <div className="bg-gradient-to-b from-[#0f1629] to-[#0a0e17] border border-slate-800/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        {/* Active Pulse */}
        {active && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="rounded-full bg-emerald-500/10 transition-all duration-300"
                style={{ 
                  width: `${200 + audioLevel * 150}px`, 
                  height: `${200 + audioLevel * 150}px`,
                  opacity: 0.3 + audioLevel * 0.4
                }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 bg-emerald-500/5 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            </div>
          </>
        )}
      </div>

      <div className="z-10 flex flex-col items-center max-w-lg w-full">
        {/* Main Icon */}
        <div className={`relative mb-8 transition-all duration-500 ${active ? 'scale-110' : ''}`}>
          <div 
            className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              active 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.4)]' 
                : status === 'connecting'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
                : status === 'error'
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                : 'bg-[#1a2234] border-2 border-slate-700'
            }`}
          >
            <span className={`material-icons-round text-5xl transition-all ${
              active ? 'text-white' : status === 'connecting' ? 'text-white animate-pulse' : 'text-slate-500'
            }`}>
              {active ? 'graphic_eq' : status === 'connecting' ? 'sync' : 'mic'}
            </span>
          </div>
          
          {/* Audio Level Indicator Ring */}
          {active && (
            <div 
              className="absolute -inset-3 rounded-[28px] border-2 border-emerald-500/50 transition-all duration-100"
              style={{ 
                transform: `scale(${1 + audioLevel * 0.15})`,
                opacity: 0.5 + audioLevel * 0.5
              }}
            ></div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">RIZBOT Live Assistant</h3>
        <p className="text-slate-400 text-sm mb-6 px-4 leading-relaxed max-w-md">
          Asisten trading suara real-time dengan basis pengetahuan <span className="text-emerald-400 font-medium">Technical Analysis for Mega Profit</span>
        </p>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 text-xs font-mono mb-8 px-4 py-2 rounded-full border transition-all ${
          status === 'connected' 
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
            : status === 'connecting'
            ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
            : status === 'error'
            ? 'border-red-500/30 text-red-400 bg-red-500/10'
            : 'border-slate-700 text-slate-500 bg-slate-800/50'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            status === 'connected' ? 'bg-emerald-500 animate-pulse' 
            : status === 'connecting' ? 'bg-blue-500 animate-pulse'
            : status === 'error' ? 'bg-red-500'
            : 'bg-slate-600'
          }`}></span>
          {statusText}
        </div>

        {/* Action Button */}
        <button
          onClick={active ? stopSession : startSession}
          disabled={status === 'connecting'}
          className={`w-full max-w-sm py-4 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            active 
              ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-xl shadow-red-900/30 hover:shadow-red-900/50' 
              : 'bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 shadow-xl shadow-blue-900/30 hover:shadow-blue-900/50'
          }`}
        >
          <span className="material-icons-round text-xl">
            {status === 'connecting' ? 'sync' : active ? 'call_end' : 'record_voice_over'}
          </span>
          {status === 'connecting' ? 'Menghubungkan...' : active ? 'Akhiri Sesi' : 'Mulai Percakapan'}
        </button>

        {/* System Logs */}
        <div className="mt-8 w-full max-w-md bg-[#0a0e17] border border-slate-800/40 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">System Logs</span>
            {logs.length > 0 && (
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
            {logs.length === 0 && (
              <span className="text-slate-600 text-xs italic flex items-center gap-2">
                <span className="material-icons-round text-sm">terminal</span>
                Menunggu koneksi...
              </span>
            )}
            {logs.map((log, i) => (
              <div 
                key={i} 
                className={`text-xs font-mono border-l-2 pl-2 py-0.5 ${
                  log.type === 'success' ? 'border-emerald-500/50 text-emerald-500/80' 
                  : log.type === 'error' ? 'border-red-500/50 text-red-500/80'
                  : 'border-slate-700 text-slate-500'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;