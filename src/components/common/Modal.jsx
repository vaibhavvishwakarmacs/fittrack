import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useScrollLock } from '../../lib/scrollLock';

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useScrollLock(isOpen);

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentDragYRef = useRef(0);
  const contentRef = useRef(null);
  const isTouchInitiatedOnScrollableRef = useRef(false);

  // Smooth slide-down exit animation
  const handleTriggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setDragY(0);
      onClose();
    }, 220);
  }, [onClose]);

  // Escape key support
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleTriggerClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTriggerClose]);

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setDragY(0);
      setIsDragging(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Touch & Pointer Gesture Tracking for Drag-Down Dismissal
  const handleDragStart = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    currentDragYRef.current = 0;

    // Check if touch started inside scrollable content
    if (contentRef.current && contentRef.current.contains(e.target)) {
      if (contentRef.current.scrollTop > 0) {
        isTouchInitiatedOnScrollableRef.current = true;
        return;
      }
    }
    isTouchInitiatedOnScrollableRef.current = false;
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;

    // If gesture started in scrollable content, allow dragging card down when at top
    if (!isDragging) {
      if (isTouchInitiatedOnScrollableRef.current && contentRef.current) {
        if (contentRef.current.scrollTop <= 0 && deltaY > 10) {
          isTouchInitiatedOnScrollableRef.current = false;
          setIsDragging(true);
          startYRef.current = clientY;
        }
      }
      return;
    }

    if (deltaY > 0) {
      // Direct 1:1 downward tracking with subtle damping
      currentDragYRef.current = deltaY;
      setDragY(deltaY);
    } else {
      // Rubber-band resistance when pulling upwards
      const dampened = deltaY * 0.16;
      currentDragYRef.current = dampened;
      setDragY(dampened);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentDragYRef.current;
    const duration = Date.now() - startTimeRef.current;
    const velocity = deltaY / Math.max(1, duration);

    // Dismiss if pulled down > 80px or flicked down with velocity > 0.35
    if (deltaY > 80 || (velocity > 0.35 && deltaY > 25)) {
      handleTriggerClose();
    } else {
      // Spring back to center
      setDragY(0);
    }
  };

  const backdropOpacity = Math.max(0.15, 1 - (Math.max(0, dragY) / 360) * 0.75);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none touch-none overscroll-none"
      onTouchMove={(e) => {
        // Prevent background page touch gestures from scrolling viewport
        if (!contentRef.current || !contentRef.current.contains(e.target)) {
          e.preventDefault();
        }
      }}
    >
      {/* Backdrop with smooth blur and real-time drag fade */}
      <div
        style={{ opacity: isClosing ? 0 : backdropOpacity }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={handleTriggerClose}
      />

      {/* Modal / Bottom Sheet Box with True Drag-Down Dismissal */}
      <div
        style={{
          transform: isClosing
            ? 'translateY(100%)'
            : isDragging
            ? `translateY(${dragY}px)`
            : 'translateY(0)',
          transition: isDragging
            ? 'none'
            : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
        }}
        className={cn(
          'relative w-full bg-[#0a0d14] border-t sm:border border-white/10 sm:rounded-3xl rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.85),0_20px_50px_rgba(0,0,0,0.95)] z-10 max-h-[92vh] flex flex-col overflow-hidden will-change-transform',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Interactive Drag Handle Area */}
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={isDragging ? handleDragMove : undefined}
          onMouseUp={isDragging ? handleDragEnd : undefined}
          className="flex flex-col items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none select-none group"
          title="Drag down to close"
        >
          <div
            className={cn(
              'h-1.5 rounded-full transition-all duration-200',
              isDragging
                ? 'w-16 bg-lime shadow-[0_0_10px_rgba(187,244,61,0.6)]'
                : 'w-12 bg-white/25 group-hover:bg-white/45'
            )}
          />
        </div>

        {/* Header - Also draggable to dismiss */}
        <div
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={isDragging ? handleDragMove : undefined}
          onMouseUp={isDragging ? handleDragEnd : undefined}
          className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-white/[0.06] select-none cursor-grab active:cursor-grabbing"
        >
          <div className="min-w-0 pr-3 pointer-events-none">
            {title && (
              <h2 className="text-lg font-black text-white tracking-tight truncate">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={handleTriggerClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content (touch-pan-y enabled) */}
        <div
          ref={contentRef}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className="p-5 overflow-y-auto no-scrollbar max-h-[calc(92vh-5rem)] overscroll-contain touch-pan-y"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
