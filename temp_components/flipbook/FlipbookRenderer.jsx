import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, List, BookOpen, Scroll, Grid3X3, Newspaper, PenTool, CreditCard, MonitorPlay, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WidgetOverlay from './WidgetOverlay';
import RealFlipBook from './RealFlipBook';

export default function FlipbookRenderer({ 
  pages = [], 
  overlays = [], 
  toc = [],
  onPageChange,
  initialPage = 0,
  showControls = true,
  className = ''
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next');
  const [viewMode, setViewMode] = useState('flip'); // flip, magazine, book, notebook, cards, coverflow, scroll, grid, slideshow
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  const totalPages = pages.length;

  const goToPage = useCallback((page, direction = null) => {
    if (page < 0 || page >= totalPages || isFlipping) return;
    
    setFlipDirection(direction || (page > currentPage ? 'next' : 'prev'));
    setIsFlipping(true);
    
    setTimeout(() => {
      setCurrentPage(page);
      setIsFlipping(false);
      onPageChange?.(page);
    }, 400);
  }, [currentPage, totalPages, isFlipping, onPageChange]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1, 'next');
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1, 'prev');
    }
  }, [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, isFullscreen]);

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentOverlays = overlays.filter(o => o.page === currentPage);
  const currentDoubleOverlays = ['magazine', 'book'].includes(viewMode)
    ? overlays.filter(o => o.page === currentPage || o.page === currentPage + 1)
    : currentOverlays;

  // Flip Mode - Real 3D page flip effect with react-pageflip
  const renderFlipMode = () => (
    <RealFlipBook
      pages={pages}
      overlays={overlays}
      onPageChange={setCurrentPage}
      viewMode="flip"
      zoom={zoom}
      className="max-h-[70vh]"
    />
  );

  // Magazine Mode - Real flip with double page spread
  const renderMagazineMode = () => (
    <RealFlipBook
      pages={pages}
      overlays={overlays}
      onPageChange={setCurrentPage}
      viewMode="magazine"
      zoom={zoom}
      className="max-h-[70vh]"
    />
  );

  // Book Mode - Real flip book effect
  const renderBookMode = () => (
    <RealFlipBook
      pages={pages}
      overlays={overlays}
      onPageChange={setCurrentPage}
      viewMode="book"
      zoom={zoom}
      className="max-h-[70vh]"
    />
  );

  // Notebook Mode - Real flip with spiral binding effect
  const renderNotebookMode = () => (
    <div className="relative">
      {/* Spiral binding */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-evenly items-center py-8 z-10 rounded-l-lg border-r-2 border-slate-700">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-500" />
        ))}
      </div>
      <div className="pl-12">
        <RealFlipBook
          pages={pages}
          overlays={overlays}
          onPageChange={setCurrentPage}
          viewMode="notebook"
          zoom={zoom}
          className="max-h-[70vh]"
        />
      </div>
    </div>
  );

  // Cards Mode - Stacked cards
  const renderCardsMode = () => (
    <div className="relative h-[70vh] w-[500px]">
      <AnimatePresence mode="popLayout">
        {pages.slice(currentPage, currentPage + 3).map((page, index) => (
          <motion.div
            key={currentPage + index}
            initial={{ scale: 0.9, y: -20, opacity: 0 }}
            animate={{ 
              scale: 1 - (index * 0.05),
              y: index * 20,
              opacity: 1 - (index * 0.3),
              zIndex: 10 - index
            }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl cursor-pointer"
            onClick={() => index === 0 && nextPage()}
          >
            <img
              src={page}
              alt={`Page ${currentPage + index + 1}`}
              className="w-full h-full object-contain"
              draggable={false}
            />
            {index === 0 && overlays.filter(o => o.page === currentPage).map((overlay) => (
              <WidgetOverlay key={overlay.id} overlay={overlay} />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  // Coverflow Mode - 3D carousel
  const renderCoverflowMode = () => (
    <div className="flex items-center justify-center gap-8 perspective-[1500px]" style={{ height: '70vh' }}>
      {[-2, -1, 0, 1, 2].map((offset) => {
        const pageIndex = currentPage + offset;
        if (pageIndex < 0 || pageIndex >= totalPages) return null;
        
        const isCenter = offset === 0;
        
        return (
          <motion.div
            key={pageIndex}
            initial={{ rotateY: offset * 45, x: offset * 200, scale: isCenter ? 1 : 0.7, opacity: isCenter ? 1 : 0.5 }}
            animate={{ 
              rotateY: offset * 45,
              x: offset * 200,
              scale: isCenter ? 1 : 0.7,
              opacity: isCenter ? 1 : 0.5,
              zIndex: isCenter ? 10 : 5 - Math.abs(offset)
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className={`rounded-xl overflow-hidden shadow-2xl cursor-pointer ${isCenter ? '' : 'pointer-events-none'}`}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={() => !isCenter && setCurrentPage(pageIndex)}
          >
            <img
              src={pages[pageIndex]}
              alt={`Page ${pageIndex + 1}`}
              className="h-[60vh] w-auto object-contain"
              draggable={false}
            />
            {isCenter && overlays.filter(o => o.page === pageIndex).map((overlay) => (
              <WidgetOverlay key={overlay.id} overlay={overlay} />
            ))}
          </motion.div>
        );
      })}
    </div>
  );

  // Slideshow Mode - Presentation style
  const renderSlideshowMode = () => (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative rounded-xl overflow-hidden shadow-2xl"
        >
          <img
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-h-[70vh] w-auto object-contain"
            draggable={false}
          />
          {currentOverlays.map((overlay) => (
            <WidgetOverlay key={overlay.id} overlay={overlay} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderSinglePage = () => (
    <div className="relative perspective-1000">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ 
            rotateY: flipDirection === 'next' ? -90 : 90,
            opacity: 0 
          }}
          animate={{ 
            rotateY: 0,
            opacity: 1 
          }}
          exit={{ 
            rotateY: flipDirection === 'next' ? 90 : -90,
            opacity: 0 
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/50"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {pages[currentPage] ? (
            <img
              src={pages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="max-h-[70vh] w-auto object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-[500px] h-[700px] bg-slate-800 flex items-center justify-center">
              <span className="text-slate-500">Page {currentPage + 1}</span>
            </div>
          )}

          {currentOverlays.map((overlay) => (
            <WidgetOverlay key={overlay.id} overlay={overlay} />
          ))}

          <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-slate-800/50 to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderDoublePage = () => (
    <div className="flex gap-4">
      {[currentPage, currentPage + 1].map((pageIndex) => (
        pageIndex < totalPages && (
          <motion.div
            key={pageIndex}
            initial={{ opacity: 0, x: pageIndex === currentPage ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/50"
          >
            <img
              src={pages[pageIndex]}
              alt={`Page ${pageIndex + 1}`}
              className="max-h-[70vh] w-auto object-contain"
              draggable={false}
            />
            {overlays.filter(o => o.page === pageIndex).map((overlay) => (
              <WidgetOverlay key={overlay.id} overlay={overlay} />
            ))}
          </motion.div>
        )
      ))}
    </div>
  );

  const renderScrollMode = () => (
    <div ref={scrollRef} className="w-full max-w-4xl mx-auto space-y-6 overflow-y-auto max-h-[80vh] px-4">
      {pages.map((page, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative rounded-lg overflow-hidden shadow-xl shadow-black/30"
        >
          <img
            src={page}
            alt={`Page ${index + 1}`}
            className="w-full h-auto object-contain"
            draggable={false}
          />
          {overlays.filter(o => o.page === index).map((overlay) => (
            <WidgetOverlay key={overlay.id} overlay={overlay} />
          ))}
        </motion.div>
      ))}
    </div>
  );

  const renderGridMode = () => (
    <div className="w-full max-w-6xl mx-auto overflow-y-auto max-h-[80vh] px-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {pages.map((page, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => {
              setCurrentPage(index);
              setViewMode('single');
            }}
            className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
          >
            <img
              src={page}
              alt={`Page ${index + 1}`}
              className="w-full h-auto object-contain"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <span className="text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Page {index + 1}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center bg-slate-950 ${className} ${isFullscreen ? 'p-8' : ''}`}
    >
      {/* TOC Sidebar */}
      <AnimatePresence>
        {showToc && toc.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-30 overflow-y-auto"
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Sommaire</h3>
              <div className="space-y-1">
                {toc.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      goToPage(item.page - 1);
                      setShowToc(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      currentPage === item.page - 1 
                        ? 'bg-cyan-500/20 text-cyan-400' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm">{item.title}</span>
                    <span className="float-right text-xs opacity-50">p.{item.page}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Container */}
      <div 
        className="relative flex items-center justify-center w-full"
        style={{ 
          transform: ['scroll', 'grid', 'coverflow'].includes(viewMode) ? 'none' : `scale(${zoom})`,
          transition: 'transform 0.3s ease'
        }}
      >
        {viewMode === 'flip' && renderFlipMode()}
        {viewMode === 'magazine' && renderMagazineMode()}
        {viewMode === 'book' && renderBookMode()}
        {viewMode === 'notebook' && renderNotebookMode()}
        {viewMode === 'cards' && renderCardsMode()}
        {viewMode === 'coverflow' && renderCoverflowMode()}
        {viewMode === 'slideshow' && renderSlideshowMode()}
        {viewMode === 'scroll' && renderScrollMode()}
        {viewMode === 'grid' && renderGridMode()}

        {/* Navigation Arrows - Hide for scroll/grid modes */}
        {showControls && !['scroll', 'grid'].includes(viewMode) && (
          <>
            <button
              onClick={prevPage}
              disabled={currentPage === 0 || isFlipping}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-cyan-500/50 transition-all z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1 || isFlipping}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 hover:border-cyan-500/50 transition-all z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-800">
          {/* View Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
              >
                {viewMode === 'flip' && <Layers className="w-5 h-5" />}
                {viewMode === 'magazine' && <Newspaper className="w-5 h-5" />}
                {viewMode === 'book' && <BookOpen className="w-5 h-5" />}
                {viewMode === 'notebook' && <PenTool className="w-5 h-5" />}
                {viewMode === 'cards' && <CreditCard className="w-5 h-5" />}
                {viewMode === 'coverflow' && <MonitorPlay className="w-5 h-5" />}
                {viewMode === 'slideshow' && <MonitorPlay className="w-5 h-5" />}
                {viewMode === 'scroll' && <Scroll className="w-5 h-5" />}
                {viewMode === 'grid' && <Grid3X3 className="w-5 h-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-800 max-h-[400px] overflow-y-auto">
              <DropdownMenuItem 
                onClick={() => setViewMode('flip')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'flip' ? 'text-cyan-400' : ''}`}
              >
                <Layers className="w-4 h-4 mr-2" />
                Flip 3D
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('magazine')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'magazine' ? 'text-cyan-400' : ''}`}
              >
                <Newspaper className="w-4 h-4 mr-2" />
                Magazine
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('book')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'book' ? 'text-cyan-400' : ''}`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Livre
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('notebook')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'notebook' ? 'text-cyan-400' : ''}`}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Carnet
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('cards')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'cards' ? 'text-cyan-400' : ''}`}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Cartes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('coverflow')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'coverflow' ? 'text-cyan-400' : ''}`}
              >
                <MonitorPlay className="w-4 h-4 mr-2" />
                Coverflow
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('slideshow')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'slideshow' ? 'text-cyan-400' : ''}`}
              >
                <MonitorPlay className="w-4 h-4 mr-2" />
                Diaporama
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('scroll')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'scroll' ? 'text-cyan-400' : ''}`}
              >
                <Scroll className="w-4 h-4 mr-2" />
                Défilement
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setViewMode('grid')}
                className={`text-slate-300 hover:text-white cursor-pointer ${viewMode === 'grid' ? 'text-cyan-400' : ''}`}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grille
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* TOC Toggle */}
          {toc.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowToc(!showToc)}
              className={`text-slate-400 hover:text-white ${showToc ? 'text-cyan-400' : ''}`}
            >
              <List className="w-5 h-5" />
            </Button>
          )}

          {/* Zoom Controls - Hide for scroll/grid/coverflow modes */}
          {!['scroll', 'grid', 'coverflow', 'cards'].includes(viewMode) && (
            <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-400 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          )}

          {/* Page Slider - Hide for scroll/grid modes */}
          {!['scroll', 'grid'].includes(viewMode) && (
            <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-sm text-slate-500">{currentPage + 1}</span>
            <Slider
              value={[currentPage]}
              min={0}
              max={Math.max(0, totalPages - 1)}
              step={1}
              onValueChange={([val]) => goToPage(val)}
              className="w-32"
            />
            <span className="text-sm text-slate-500">{totalPages}</span>
          </div>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      )}
    </div>
  );
}