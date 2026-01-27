import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, Settings, Menu, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import HTMLFlipBook from 'react-pageflip';
import './flipbook3d.css';

export default function FlipbookViewer3D({ pages = [], title = 'Flipbook', overlays = [], aspectRatio = 5/7 }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState('flip3d');
  const [autoPlay, setAutoPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const containerRef = useRef(null);
  const flipBookRef = useRef(null);
  const audioRef = useRef(null);

  const totalPages = pages.length;

  // Initialiser l'audio pour le son de flip
  useEffect(() => {
    audioRef.current = new Audio('/sounds/page-flip.mp3');
    audioRef.current.volume = 0.3;
    audioRef.current.preload = 'auto';
    console.log('✅ Audio MP3 chargé depuis /sounds/page-flip.mp3');
  }, []);

  // Fonction pour jouer le son de flip
  const playFlipSound = () => {
    if (!soundEnabled) return;
    
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => {
          console.error('❌ Erreur lecture audio:', err);
        });
      }
    } catch (error) {
      console.error('❌ Erreur son:', error);
    }
  };

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      if (['flip3d', 'book', 'magazine', 'notebook'].includes(viewMode) && flipBookRef.current) {
        flipBookRef.current.pageFlip().flipNext();
      } else {
        setCurrentPage(prev => (prev + 1) % totalPages);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [autoPlay, totalPages, viewMode]);

  const handlePrevPage = () => {
    playFlipSound();
    if (['flip3d', 'book', 'magazine', 'notebook'].includes(viewMode) && flipBookRef.current) {
      flipBookRef.current.pageFlip().flipPrev();
    } else {
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
  };

  const handleNextPage = () => {
    playFlipSound();
    if (['flip3d', 'book', 'magazine', 'notebook'].includes(viewMode) && flipBookRef.current) {
      flipBookRef.current.pageFlip().flipNext();
    } else {
      setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.6));
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.() || containerRef.current?.webkitRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const onFlip = (e) => {
    playFlipSound();
    setCurrentPage(e.data);
  };

  const modes = [
    { id: 'flip3d', label: 'Flip 3D', icon: '📖' },
    { id: 'magazine', label: 'Magazine', icon: '📰' },
    { id: 'book', label: 'Livre', icon: '📕' },
    { id: 'notebook', label: 'Carnet', icon: '📓' },
    { id: 'cards', label: 'Cartes', icon: '🎴' },
    { id: 'coverflow', label: 'Coverflow', icon: '🎬' },
    { id: 'slideshow', label: 'Diapo', icon: '🖼️' },
    { id: 'grid', label: 'Grille', icon: '⊞' },
  ];

  const renderPage = (page, idx, className = '') => {
    return (
      <img
        src={page}
        alt={`Page ${idx + 1}`}
        className={`w-full h-full object-contain ${className}`}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700"%3E%3Crect fill="%23f5f5f5" width="500" height="700"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3EPage ${idx + 1}%3C/text%3E%3C/svg%3E`;
        }}
      />
    );
  };

  // Calculate dimensions for FlipBook
  const getFlipBookDimensions = () => {
    if (!containerRef.current) return { width: 400, height: 600 };
    
    const containerWidth = containerRef.current.offsetWidth - 100;
    const containerHeight = containerRef.current.offsetHeight - 100;
    
    let pageHeight = containerHeight * 0.9;
    let pageWidth = pageHeight * aspectRatio;
    
    if (pageWidth > containerWidth * 0.45) {
      pageWidth = containerWidth * 0.4;
      pageHeight = pageWidth / aspectRatio;
    }

    return { 
      width: Math.floor(pageWidth * zoom), 
      height: Math.floor(pageHeight * zoom) 
    };
  };

  const dimensions = getFlipBookDimensions();

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex-shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-white truncate">{title}</h2>
          <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
            {currentPage + 1}/{totalPages}
          </span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mode Selector - Desktop */}
          <div className="hidden xl:flex rounded-lg border border-slate-600 overflow-hidden bg-slate-800/50">
            {modes.map(mode => (
              <Button
                key={mode.id}
                size="sm"
                variant="ghost"
                onClick={() => setViewMode(mode.id)}
                className={`rounded-none text-xs whitespace-nowrap px-2 py-1 transition-all ${
                  viewMode === mode.id 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </Button>
            ))}
          </div>

          {/* Mode Selector - Mobile/Tablet */}
          <div className="xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-slate-400 hover:text-white gap-1"
                >
                  <Menu className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">
                    {modes.find(m => m.id === viewMode)?.label}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                {modes.map(mode => (
                  <DropdownMenuItem
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`text-xs cursor-pointer ${
                      viewMode === mode.id 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="mr-2">{mode.icon}</span>
                    {mode.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-6 bg-slate-600 mx-1" />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="text-slate-400 hover:text-white disabled:opacity-30 w-8 h-8 sm:w-10 sm:h-10"
            title="Page précédente"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomOut}
            className="text-slate-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10 hidden sm:flex"
            title="Dézoomer"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <span className="text-[10px] sm:text-xs text-slate-400 w-8 sm:w-12 text-center hidden sm:block">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleZoomIn}
            className="text-slate-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10 hidden sm:flex"
            title="Zoomer"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="text-slate-400 hover:text-white disabled:opacity-30 w-8 h-8 sm:w-10 sm:h-10"
            title="Page suivante"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <div className="w-px h-6 bg-slate-600 mx-1" />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`text-slate-400 transition-colors w-8 h-8 sm:w-10 sm:h-10 ${autoPlay ? 'text-cyan-400 bg-cyan-500/20' : 'hover:text-white'}`}
            title={autoPlay ? 'Arrêter' : 'Diaporama'}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          {/* Bouton Son */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`text-slate-400 transition-colors w-8 h-8 sm:w-10 sm:h-10 ${soundEnabled ? 'text-cyan-400 bg-cyan-500/20' : 'hover:text-white'}`}
            title={soundEnabled ? 'Son activé' : 'Son désactivé'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
        </div>
      </div>

      {/* Flipbook Content */}
      <div className="flex-1 w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black flex items-center justify-center p-4 overflow-hidden">
        
        {/* ========== MODE 1: FLIP 3D ========== */}
        {viewMode === 'flip3d' && pages.length > 0 && (
          <div className="flex items-center justify-center w-full h-full">
            <HTMLFlipBook
              ref={flipBookRef}
              width={dimensions.width}
              height={dimensions.height}
              size="stretch"
              minWidth={200}
              maxWidth={1000}
              minHeight={300}
              maxHeight={1600}
              drawShadow={true}
              flippingTime={1000}
              usePortrait={false}
              startPage={0}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              onFlip={onFlip}
              className="shadow-2xl shadow-cyan-500/30"
              style={{ borderRadius: '8px' }}
            >
              {pages.map((page, idx) => (
                <div key={idx} className="bg-white" style={{ overflow: 'hidden' }}>
                  {renderPage(page, idx)}
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        )}

        {/* ========== MODE 2: MAGAZINE ========== */}
        {viewMode === 'magazine' && pages.length > 0 && (
          <div className="flex items-center justify-center w-full h-full">
            <HTMLFlipBook
              ref={flipBookRef}
              width={dimensions.width}
              height={dimensions.height}
              size="stretch"
              minWidth={200}
              maxWidth={1000}
              minHeight={300}
              maxHeight={1600}
              drawShadow={true}
              flippingTime={800}
              usePortrait={false}
              startPage={0}
              maxShadowOpacity={0.4}
              showCover={false}
              mobileScrollSupport={true}
              onFlip={onFlip}
              className="shadow-2xl"
            >
              {pages.map((page, idx) => (
                <div key={idx} className="bg-white relative" style={{ overflow: 'hidden' }}>
                  {renderPage(page, idx)}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        )}

        {/* ========== MODE 3: LIVRE ========== */}
        {viewMode === 'book' && pages.length > 0 && (
          <div className="flex items-center justify-center w-full h-full">
            <div className="flex items-center">
              <div 
                style={{ 
                  width: '24px',
                  height: `${dimensions.height}px`,
                  background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
                  boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.5), inset -4px 0 8px rgba(0,0,0,0.5)',
                  position: 'relative',
                  borderRadius: '4px 0 0 4px',
                }}
              >
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600"></div>
              </div>
              
              <HTMLFlipBook
                ref={flipBookRef}
                width={dimensions.width}
                height={dimensions.height}
                size="fixed"
                minWidth={200}
                maxWidth={1000}
                minHeight={300}
                maxHeight={1600}
                drawShadow={true}
                flippingTime={900}
                usePortrait={false}
                startPage={0}
                maxShadowOpacity={0.6}
                showCover={false}
                mobileScrollSupport={true}
                onFlip={onFlip}
                style={{ boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.3)' }}
              >
                {pages.map((page, idx) => (
                  <div key={idx} className="bg-white relative" style={{ overflow: 'hidden' }}>
                    {renderPage(page, idx)}
                    {idx % 2 === 0 ? (
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none"></div>
                    ) : (
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"></div>
                    )}
                  </div>
                ))}
              </HTMLFlipBook>
            </div>
          </div>
        )}

        {/* ========== MODE 4: CARNET ========== */}
        {viewMode === 'notebook' && pages.length > 0 && (
          <div className="flex items-center justify-center w-full h-full">
            <HTMLFlipBook
              ref={flipBookRef}
              width={dimensions.width}
              height={dimensions.height}
              size="stretch"
              minWidth={200}
              maxWidth={1000}
              minHeight={300}
              maxHeight={1600}
              drawShadow={true}
              flippingTime={700}
              usePortrait={false}
              startPage={0}
              maxShadowOpacity={0.3}
              showCover={true}
              mobileScrollSupport={true}
              onFlip={onFlip}
              className="shadow-2xl"
            >
              {pages.map((page, idx) => (
                <div key={idx} className="bg-white relative" style={{ overflow: 'hidden' }}>
                  <div className="absolute inset-0 border-8 border-yellow-100 rounded-lg pointer-events-none"></div>
                  <div 
                    className="absolute inset-0 pointer-events-none z-10" 
                    style={{
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 35px, rgba(100, 150, 200, 0.15) 35px, rgba(100, 150, 200, 0.15) 36px)',
                    }}
                  />
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gray-400 via-gray-500 to-gray-400 z-20"></div>
                  <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-around z-20">
                    {[...Array(12)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-6 h-2 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 50%, #4b5563 100%)',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute left-12 top-0 bottom-0 w-px bg-red-400/50 z-10"></div>
                  {renderPage(page, idx)}
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        )}

        {/* ========== MODE 5: CARTES ========== */}
        {viewMode === 'cards' && (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden" style={{ perspective: '2000px' }}>
            <AnimatePresence mode="popLayout">
              {pages.slice(currentPage, Math.min(currentPage + 4, totalPages)).map((page, stackIndex) => {
                const realIndex = currentPage + stackIndex;
                const isTop = stackIndex === 0;
                
                const containerHeight = containerRef.current?.offsetHeight || 800;
                const containerWidth = containerRef.current?.offsetWidth || 600;
                
                let maxHeightRatio = 0.6;
                if (containerWidth > 640) maxHeightRatio = 0.65;
                if (containerWidth > 1024) maxHeightRatio = 0.7;
                
                let cardHeight = containerHeight * maxHeightRatio;
                let cardWidth = cardHeight * aspectRatio;
                
                const maxWidthRatio = containerWidth > 640 ? 0.65 : 0.8;
                if (cardWidth > containerWidth * maxWidthRatio) {
                  cardWidth = containerWidth * maxWidthRatio;
                  cardHeight = cardWidth / aspectRatio;
                }
                
                cardHeight = Math.max(250, Math.min(cardHeight, 700));
                cardWidth = cardHeight * aspectRatio;
                
                const zoomApplied = Math.min(zoom, 1.2);
                cardWidth *= zoomApplied;
                cardHeight *= zoomApplied;
                
                return (
                  <motion.div
                    key={realIndex}
                    initial={isTop ? { 
                      x: 400,
                      rotateZ: 8,
                      rotateY: 10,
                      opacity: 0,
                      scale: 0.8
                    } : false}
                    animate={{ 
                      x: 0,
                      y: stackIndex * 8,
                      rotateZ: stackIndex * -1.5,
                      rotateY: stackIndex * 2,
                      opacity: 1 - stackIndex * 0.25,
                      scale: 1 - stackIndex * 0.05,
                      zIndex: 100 - stackIndex
                    }}
                    exit={isTop ? { 
                      x: -400,
                      rotateZ: -8,
                      rotateY: -10,
                      opacity: 0,
                      scale: 0.8
                    } : false}
                    transition={{ 
                      duration: 0.6,
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: isTop ? 0 : stackIndex * 0.05
                    }}
                    className="absolute"
                    style={{
                      transformStyle: 'preserve-3d',
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                    }}
                  >
                    <div 
                      className="relative rounded-2xl shadow-2xl overflow-hidden w-full h-full"
                      style={{ 
                        background: isTop 
                          ? 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)' 
                          : '#ffffff',
                        padding: isTop ? '4px' : '0',
                        boxShadow: isTop 
                          ? '0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(34, 211, 238, 0.3)'
                          : '0 15px 30px rgba(0,0,0,0.2)',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                        {renderPage(page, realIndex)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ========== MODE 6: COVERFLOW ========== */}
        {viewMode === 'coverflow' && (
          <div className="w-full h-full flex items-center justify-center" style={{ perspective: '2500px' }}>
            <div className="flex items-center gap-4 relative">
              {pages.map((page, idx) => {
                const offset = idx - currentPage;
                const isActive = offset === 0;
                const isVisible = Math.abs(offset) <= 3;
                
                if (!isVisible) return null;
                
                return (
                  <motion.div
                    key={idx}
                    className="cursor-pointer absolute"
                    onClick={() => {
                      playFlipSound();
                      setCurrentPage(idx);
                    }}
                    animate={{
                      x: offset * 180,
                      rotateY: offset * 45,
                      z: -Math.abs(offset) * 150,
                      opacity: Math.abs(offset) > 2 ? 0.3 : 1,
                      scale: isActive ? 1 : 0.65,
                    }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `scale(${isActive ? zoom : zoom * 0.65})`,
                      zIndex: 10 - Math.abs(offset),
                    }}
                  >
                    <div 
                      className={`relative bg-white rounded-xl overflow-hidden shadow-2xl ${
                        isActive ? 'ring-4 ring-cyan-400 shadow-cyan-500/50' : 'shadow-black/40'
                      }`}
                      style={{ 
                        aspectRatio: aspectRatio,
                        height: 'min(50vh, 60vw)',
                        width: 'auto',
                      }}
                    >
                      {renderPage(page, idx)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== MODE 7: DIAPORAMA ========== */}
        {viewMode === 'slideshow' && (
          <div className="w-full h-full flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="relative"
                style={{ transform: `scale(${zoom})` }}
              >
                <div 
                  className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
                  style={{ 
                    aspectRatio: aspectRatio,
                    height: 'min(75vh, 90vw)',
                    width: 'auto',
                  }}
                >
                  {renderPage(pages[currentPage], currentPage)}
                  <motion.div
                    className="absolute inset-0 border-4 border-cyan-400 rounded-2xl pointer-events-none"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="absolute bottom-4 sm:bottom-8 w-32 sm:w-64 h-1 sm:h-2 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* ========== MODE 8: GRILLE ========== */}
        {viewMode === 'grid' && (
          <div className="w-full h-full p-3 sm:p-6" style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 auto-rows-max max-w-7xl mx-auto">
              {pages.map((page, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03, duration: 0.3 }}
                  className={`rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all relative ${
                    idx === currentPage 
                      ? 'ring-2 sm:ring-4 ring-cyan-500 shadow-cyan-500/50' 
                      : 'hover:shadow-2xl'
                  }`}
                  onClick={() => {
                    playFlipSound();
                    setCurrentPage(idx);
                  }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  style={{ aspectRatio: aspectRatio }}
                >
                  <div className="relative w-full h-full bg-white group">
                    {renderPage(page, idx)}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 sm:px-3 py-1 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}