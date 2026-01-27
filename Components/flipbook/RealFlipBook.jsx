import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import WidgetOverlay from './WidgetOverlay';

export default function RealFlipBook({ 
  pages = [], 
  overlays = [], 
  onPageChange,
  viewMode = 'single',
  zoom = 1,
  className = ''
}) {
  const bookRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 550, height: 733 });

  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight * 0.7;
      const width = Math.min(550, window.innerWidth * 0.4);
      const height = Math.min(733, vh);
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleFlip = (e) => {
    if (onPageChange) {
      onPageChange(e.data);
    }
  };

  if (!pages || pages.length === 0) {
    return <div className="text-white">Aucune page disponible</div>;
  }

  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <HTMLFlipBook
        ref={bookRef}
        width={dimensions.width}
        height={dimensions.height}
        size="stretch"
        minWidth={315}
        maxWidth={1000}
        minHeight={400}
        maxHeight={1533}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        onFlip={handleFlip}
        startPage={0}
        drawShadow={true}
        flippingTime={1000}
        usePortrait={false}
        startZIndex={0}
        autoSize={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
      >
        {pages.map((page, index) => (
          <div key={index} className="page bg-white" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.2)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
              <img
                src={page}
                alt={`Page ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
              
              <div style={{ position: 'absolute', inset: 0 }}>
                {overlays
                  .filter(o => o.page === index)
                  .map((overlay) => (
                    <WidgetOverlay key={overlay.id} overlay={overlay} />
                  ))}
              </div>

              <div style={{ position: 'absolute', bottom: '16px', right: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                {index + 1}
              </div>

              {index < pages.length - 1 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  width: '48px', 
                  height: '48px', 
                  background: 'linear-gradient(to top left, rgba(226, 232, 240, 0.3), transparent)',
                  pointerEvents: 'none',
                  opacity: 0.3
                }} />
              )}
            </div>
          </div>
        ))}
      </HTMLFlipBook>
    </div>
  );
}