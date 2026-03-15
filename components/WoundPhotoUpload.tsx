"use client";

import React, { useRef, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, X, Loader2, Sparkles } from 'lucide-react';

interface WoundPhotoUploadProps {
  onPhotoCapture: (base64Data: string) => void;
  dayPostDelivery: number;
  aiResult?: {
    photo_score: string;
    patient_explanation: string;
  } | null;
  analyzing?: boolean;
}

export const WoundPhotoUpload: React.FC<WoundPhotoUploadProps> = ({ 
  onPhotoCapture, 
  dayPostDelivery, 
  aiResult, 
  analyzing = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError("");
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        // Getting base64, removing the data URL prefix just to pass raw base64 or keep it
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewUrl(dataUrl);
        stopCamera();
        
        // Pass base64 data to parent (strip data:image/jpeg;base64,)
        const base64Data = dataUrl.split(',')[1];
        onPhotoCapture(base64Data);
      }
    }
  };

  const retake = () => {
    setPreviewUrl(null);
    startCamera();
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <Camera className="text-pink-500" /> C-Section Wound Monitor
      </h3>
      <p className="text-sm text-gray-500 mb-6">Day {dayPostDelivery} postpartum assessment</p>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {!previewUrl && !stream && (
        <div 
          onClick={startCamera}
          className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="bg-pink-100 dark:bg-pink-900/30 p-4 rounded-full mb-3">
            <Camera className="text-pink-600 dark:text-pink-400 w-8 h-8" />
          </div>
          <span className="font-medium text-gray-600 dark:text-gray-300">Tap to open camera</span>
        </div>
      )}

      {/* Camera View */}
      <div className={`relative rounded-2xl overflow-hidden bg-black ${stream && !previewUrl ? 'block' : 'hidden'}`}>
        <video ref={videoRef} autoPlay playsInline className="w-full h-[300px] object-cover" />
        <div className="absolute bottom-4 left-0 w-full flex justify-center">
          <button 
            type="button"
            onClick={capturePhoto}
            className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-pink-500 rounded-full"></div>
          </button>
        </div>
        <button 
          onClick={stopCamera} 
          className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Preview View */}
      {previewUrl && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <img src={previewUrl} alt="Wound Preview" className="w-full h-[250px] object-cover" />
            
            {analyzing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400 mb-4" />
                <p className="font-medium flex items-center gap-2"><Sparkles size={16} /> AI is analyzing the wound...</p>
                <p className="text-xs text-gray-200 mt-2">Checking for redness, swelling, and healing progress.</p>
              </div>
            )}
            
            {!analyzing && !aiResult && (
              <button 
                onClick={retake}
                className="absolute bottom-4 right-4 bg-gray-900/80 text-white px-4 py-2 rounded-xl backdrop-blur text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Retake Photo
              </button>
            )}
          </div>

          {/* AI Result Banner */}
          {aiResult && !analyzing && (
            <div className={`p-4 rounded-2xl flex items-start gap-4 border ${
              aiResult.photo_score === 'emergency' || aiResult.photo_score === 'see_doctor' 
                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30'
                : aiResult.photo_score === 'monitor'
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30'
                : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'
            }`}>
              <div className="shrink-0 mt-1">
                <Sparkles className={
                   aiResult.photo_score === 'emergency' || aiResult.photo_score === 'see_doctor' ? 'text-red-500' :
                   aiResult.photo_score === 'monitor' ? 'text-amber-500' : 'text-emerald-500'
                } />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize mb-1">
                  AI Assessment: {aiResult.photo_score.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {aiResult.patient_explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
