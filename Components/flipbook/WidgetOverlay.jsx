import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WidgetOverlay({ overlay, isEditing = false, onSelect, isSelected }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { type, x, y, width, height, config } = overlay;

  const baseStyle = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    width: `${width}%`,
    height: `${height}%`,
  };

  const handleClick = (e) => {
    if (isEditing) {
      e.stopPropagation();
      onSelect?.(overlay);
    }
  };

  const renderWidget = () => {
    switch (type) {
      case 'button':
        return (
          <motion.a
            href={config?.url || '#'}
            target={config?.openInNewTab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full h-full flex items-center justify-center gap-2 rounded-lg font-medium text-white transition-all"
            style={{
              background: config?.gradient 
                ? `linear-gradient(135deg, ${config.bgColor || '#06b6d4'}, ${config.bgColorEnd || '#8b5cf6'})`
                : config?.bgColor || '#06b6d4',
              fontSize: config?.fontSize || '14px',
            }}
            onClick={isEditing ? handleClick : undefined}
          >
            {config?.icon && <ExternalLink className="w-4 h-4" />}
            {config?.label || 'Cliquez ici'}
          </motion.a>
        );

      case 'video':
        const videoId = config?.videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
        const vimeoId = config?.videoUrl?.match(/vimeo\.com\/(\d+)/)?.[1];
        
        return (
          <div 
            className="w-full h-full rounded-lg overflow-hidden bg-slate-900 relative group cursor-pointer"
            onClick={(e) => {
              if (isEditing) {
                handleClick(e);
              } else {
                setShowModal(true);
              }
            }}
          >
            {!showModal && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Play className="w-8 h-8 text-white fill-white" />
                  </motion.div>
                </div>
                {config?.thumbnail && (
                  <img src={config.thumbnail} alt="" className="w-full h-full object-cover" />
                )}
              </>
            )}
            
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowModal(false)}>
                <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute -top-12 right-0 text-white"
                    onClick={() => setShowModal(false)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  {videoId && (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                      className="w-full h-full rounded-lg"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  )}
                  {vimeoId && (
                    <iframe
                      src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`}
                      className="w-full h-full rounded-lg"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  )}
                  {config?.videoUrl?.endsWith('.mp4') && (
                    <video
                      src={config.videoUrl}
                      className="w-full h-full rounded-lg"
                      controls
                      autoPlay
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="w-full h-full rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10 p-3 flex items-center gap-3"
            onClick={isEditing ? handleClick : undefined}
          >
            <button
              onClick={(e) => {
                if (!isEditing) {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }
              }}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {isPlaying ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
            <div className="flex-1">
              <div className="text-sm text-white font-medium truncate">{config?.title || 'Audio'}</div>
              <div className="h-1 bg-white/20 rounded-full mt-2">
                <div className="h-full w-1/3 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" />
              </div>
            </div>
            {isPlaying && config?.audioUrl && (
              <audio src={config.audioUrl} autoPlay loop />
            )}
          </motion.div>
        );

      case 'iframe':
        return (
          <div 
            className="w-full h-full rounded-lg overflow-hidden border border-white/10"
            onClick={isEditing ? handleClick : undefined}
          >
            {!isEditing ? (
              <iframe
                src={config?.url}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                <span>iFrame: {config?.url}</span>
              </div>
            )}
          </div>
        );

      case 'hotspot':
        return (
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-full h-full rounded-full bg-cyan-500/30 border-2 border-cyan-400 cursor-pointer flex items-center justify-center"
            style={{
              animation: 'pulse 2s infinite',
            }}
            onClick={(e) => {
              if (isEditing) {
                handleClick(e);
              } else if (config?.targetPage) {
                // Navigate to page
              }
            }}
          >
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={baseStyle}
      className={`${isEditing ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900' : ''}`}
      onClick={handleClick}
    >
      {renderWidget()}
    </div>
  );
}