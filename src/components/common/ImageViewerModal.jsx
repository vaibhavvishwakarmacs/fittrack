import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Download, RotateCcw, ChevronDown, Maximize2 } from 'lucide-react';
import { useScrollLock } from '../../lib/scrollLock';

export const ImageViewerModal = ({
  isOpen,
  onClose,
  src,
  alt = 'Image preview',
  title,
  subtitle,
}) => {
  useScrollLock(isOpen);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingDown, setIsDraggingDown] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const startTouchRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTapRef = useRef(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Smooth dismiss animation
  const handleTriggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setScale(1);
      setPan({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
      onClose();
    }, 220);
  }, [onClose]);

  // Escape key and keyboard shortcuts (+ / -)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleTriggerClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(3, s + 0.25));
      } else if (e.key === '-') {
        setScale((s) => Math.max(1, s - 0.25));
      } else if (e.key === '0') {
        setScale(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTriggerClose]);

  // Reset transform when opened
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
      setIsDraggingDown(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen || !src) return null;

  // Double tap to toggle 1x and 2x zoom
  const handleDoubleTap = (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (scale > 1) {
        setScale(1);
        setPan({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    }
    lastTapRef.current = now;
  };

  // Touch & Pointer Gesture Tracking
  const handlePointerDown = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    startTouchRef.current = { x: clientX, y: clientY, time: Date.now() };

    if (scale > 1) {
      // In zoom mode, drag pans the image
      isPanningRef.current = true;
      panStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
    } else {
      // In normal mode, drag downwards to dismiss
      setIsDraggingDown(true);
    }
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (scale > 1 && isPanningRef.current) {
      setPan({
        x: clientX - panStartRef.current.x,
        y: clientY - panStartRef.current.y,
      });
      return;
    }

    if (!isDraggingDown) return;

    const deltaY = clientY - startTouchRef.current.y;
    const deltaX = clientX - startTouchRef.current.x;

    if (deltaY > 0) {
      // Dragging downwards
      setDragOffset({ x: deltaX * 0.35, y: deltaY });
    } else {
      // Rubber-band resistance upward
      setDragOffset({ x: deltaX * 0.2, y: deltaY * 0.15 });
    }
  };

  const handlePointerEnd = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (!isDraggingDown) return;
    setIsDraggingDown(false);

    const deltaY = dragOffset.y;
    const duration = Date.now() - startTouchRef.current.time;
    const velocity = deltaY / Math.max(1, duration);

    // Dismiss if pulled down > 80px or quick downward swipe
    if (deltaY > 80 || (velocity > 0.35 && deltaY > 25)) {
      handleTriggerClose();
    } else {
      // Spring smoothly back to center
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Backdrop opacity fades dynamically during drag-down
  const backdropOpacity = Math.max(0.2, 1 - (Math.max(0, dragOffset.y) / 360) * 0.8);
  const dragScale = Math.max(0.72, 1 - (Math.max(0, dragOffset.y) / 900));

  const viewerNode = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 select-none touch-none overscroll-none"
      onClick={handleTriggerClose}
      onTouchMove={(e) => e.preventDefault()}
    >
      {/* Cinematic Blur Backdrop with Real-time Drag Fade */}
      <div
        style={{ opacity: isClosing ? 0 : backdropOpacity }}
        className="fixed inset-0 bg-black/95 backdrop-blur-2xl transition-opacity duration-200"
      />

      {/* Floating Header Pill Bar */}
      <div
        className="fixed top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between z-20 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 pr-3">
          {title && (
            <h3 className="text-sm sm:text-base font-black text-white truncate drop-shadow-md">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-300 truncate drop-shadow-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 bg-dark-900/80 p-1.5 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, s + 0.3))}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white transition-all cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setScale((s) => {
                const next = Math.max(1, s - 0.3);
                if (next === 1) setPan({ x: 0, y: 0 });
                return next;
              });
            }}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {scale > 1 && (
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 rounded-full bg-lime/15 text-lime hover:bg-lime/25 transition-all cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <a
            href={src}
            download="fittrack-photo.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-slate-200 hover:text-white transition-all cursor-pointer"
            title="Save / Download"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={handleTriggerClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
            title="Close (Esc or Drag Down)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Swipe Down Pill Visual Cue */}
      <div
        className="fixed top-18 z-20 flex flex-col items-center pointer-events-none transition-opacity duration-300"
        style={{ opacity: isDraggingDown || dragOffset.y > 10 ? 0.9 : 0.6 }}
      >
        <div
          className={`h-1.5 rounded-full transition-all duration-200 ${
            isDraggingDown
              ? 'w-16 bg-lime shadow-[0_0_12px_rgba(187,244,61,0.7)]'
              : 'w-12 bg-white/30'
          }`}
        />
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
          <ChevronDown className="w-3 h-3 text-slate-400 animate-bounce" />
          <span>Swipe down to close</span>
        </div>
      </div>

      {/* Image Stage Container with Real-time Drag-Down Translation & Zoom */}
      <div
        onClick={handleDoubleTap}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerEnd}
        onMouseDown={handlePointerDown}
        onMouseMove={isDraggingDown || isPanningRef.current ? handlePointerMove : undefined}
        onMouseUp={isDraggingDown || isPanningRef.current ? handlePointerEnd : undefined}
        style={{
          transform: isClosing
            ? 'translateY(100vh) scale(0.8)'
            : scale > 1
            ? `translate(${pan.x}px, ${pan.y}px) scale(${scale})`
            : `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${dragScale})`,
          transition: isDraggingDown || isPanningRef.current
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: scale > 1 ? 'grab' : isDraggingDown ? 'grabbing' : 'grab',
        }}
        className="relative max-w-4xl max-h-[82vh] w-auto h-auto flex items-center justify-center rounded-3xl will-change-transform z-10 touch-none"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-3xl border border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(187,244,61,0.1)] pointer-events-none"
        />
      </div>

      {/* Bottom Hint */}
      <div className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-20">
        <p className="text-[11px] text-slate-400/80 px-3 py-1 rounded-full bg-dark-900/60 backdrop-blur-md border border-white/5">
          {scale > 1 ? 'Drag to pan • Double-tap to reset' : 'Double-tap to zoom • Drag down to close'}
        </p>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(viewerNode, document.body) : viewerNode;
};

export const ClickableImage = ({
  src,
  alt = 'Image',
  title,
  subtitle,
  className = '',
  imgClassName = '',
  onClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) return null;

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
          if (onClick) onClick(e);
        }}
        className={`relative group cursor-pointer overflow-hidden select-none active:scale-95 transition-all ${className}`}
        title="Tap to view fullscreen (Swipe down to close)"
      >
        <img src={src} alt={alt} className={imgClassName} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
          <div className="p-2 rounded-full bg-black/60 border border-white/20 text-lime shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      <ImageViewerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src={src}
        alt={alt}
        title={title || alt}
        subtitle={subtitle}
      />
    </>
  );
};
