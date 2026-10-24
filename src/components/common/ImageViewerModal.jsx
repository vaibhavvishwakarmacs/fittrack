import React, { useEffect } from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';

export const ImageViewerModal = ({
  isOpen,
  onClose,
  src,
  alt = 'Image preview',
  title,
  subtitle,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
    >
      {/* Top Controls Bar */}
      <div
        className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 pr-4">
          {title && (
            <h3 className="text-sm sm:text-base font-extrabold text-white truncate drop-shadow-md">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[11px] text-slate-300 truncate drop-shadow-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={src}
            download="fittrack-photo.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-xl border border-white/15 transition-all shadow-lg"
            title="Open or Save full image"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-xl border border-white/15 transition-all shadow-lg"
            title="Close viewer (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image Container with Smooth Scaling */}
      <div
        className="relative max-w-4xl max-h-[85vh] w-auto h-auto flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-3xl animate-in zoom-in-95 duration-200"
        />
      </div>

      <p className="absolute bottom-4 text-[11px] text-slate-400 font-medium">
        Tap anywhere outside or press Esc to close
      </p>
    </div>
  );
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
  const [isOpen, setIsOpen] = React.useState(false);

  if (!src) return null;

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
          if (onClick) onClick(e);
        }}
        className={`relative group cursor-pointer overflow-hidden select-none active:scale-95 transition-transform ${className}`}
        title="Tap to view fullscreen"
      >
        <img src={src} alt={alt} className={imgClassName} />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
          <ZoomIn className="w-4 h-4 drop-shadow-md text-white" />
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
