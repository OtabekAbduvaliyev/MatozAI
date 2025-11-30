import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  audioBlob: Blob | null;
  isPlaying: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording && stream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({});
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const analyser = ctx.createAnalyser();
      // Increase FFT size for smoother, more detailed data
      analyser.fftSize = 256; 
      // Smoothing constant for fluid motion (not jittery)
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      draw();
    } else {
      cleanupAudio();
    }
    return () => {
      cleanupAudio();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording, stream]);

  const cleanupAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We only need half the frequency data (up to Nyquist)
    const bufferLength = analyser.frequencyBinCount; 
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      
      // Clear with transparency
      ctx.clearRect(0, 0, width, height);
      
      // Create Gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#34d399'); // Emerald 400
      gradient.addColorStop(0.5, '#10b981'); // Emerald 500
      gradient.addColorStop(1, '#059669'); // Emerald 600
      ctx.fillStyle = gradient;

      // Draw mirrored bars from center line
      // We will skip some high frequencies as voice is mostly low-mid
      const usefulBins = Math.floor(bufferLength * 0.7); 
      const barWidth = (width / usefulBins) * 0.6; // Gap between bars
      const gap = (width / usefulBins) * 0.4;
      const centerY = height / 2;

      for (let i = 0; i < usefulBins; i++) {
        // Boost values slightly to look responsive
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = percent * height * 0.8; 

        // Center X position logic can be simple L->R or mirrored Center->Out
        // Let's do simple L->R but vertically mirrored (Symetrical Wave)
        
        const x = i * (barWidth + gap);
        
        // Draw rounded pill shape
        // Top half
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 4);
        ctx.fill();
      }
    };

    renderFrame();
  };

  return (
    <canvas 
        ref={canvasRef} 
        width={400} 
        height={80} 
        className="w-full h-full opacity-90"
    />
  );
};

export default AudioVisualizer;