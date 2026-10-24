import React, { useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { storageService } from '../../services/storageService';
import { Camera, Loader2, User } from 'lucide-react';
import { ImageViewerModal } from '../common/ImageViewerModal';

export const AvatarUploader = () => {
  const { user, profile, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const handleFileChange = async (e) => {
    if (!user || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploading(true);
    try {
      const { url, error } = await storageService.uploadUserImage(user.id, file, 'avatar');
      if (error || !url) {
        toastError(error?.message || 'Failed to upload avatar');
      } else {
        await updateProfile({ avatar_url: url });
        success('Avatar updated successfully!');
      }
    } catch (err) {
      toastError(err?.message || 'Error updating avatar');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative group inline-block">
        <div
          onClick={() => profile?.avatar_url && setShowViewer(true)}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-lime/40 bg-dark-850 overflow-hidden flex items-center justify-center shadow-lg relative ${profile?.avatar_url ? 'cursor-pointer hover:border-lime transition-all active:scale-95' : ''}`}
          title={profile?.avatar_url ? 'Tap to view avatar in full mode' : undefined}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-lime animate-spin" />
            </div>
          )}
        </div>

      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-0 right-0 p-2 rounded-full bg-lime text-dark-950 shadow-md hover:bg-lime-hover active:scale-95 transition-all cursor-pointer focus:outline-none"
        title="Upload new avatar"
        aria-label="Upload new avatar"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {profile?.avatar_url && (
        <ImageViewerModal
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          src={profile.avatar_url}
          alt={profile.full_name || 'Profile Avatar'}
          title={profile.full_name || 'Profile Picture'}
        />
      )}
    </>
  );
};

