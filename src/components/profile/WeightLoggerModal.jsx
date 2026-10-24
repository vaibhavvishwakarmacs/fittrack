import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { weightService } from '../../services/weightService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateToISO } from '../../lib/utils';
import { Scale, Percent, Camera, X } from 'lucide-react';
import { ClickableImage } from '../common/ImageViewerModal';

export const WeightLoggerModal = ({
  isOpen,
  onClose,
  onWeightLogged,
  defaultDate,
  initialWeight,
}) => {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [date, setDate] = useState(defaultDate || formatDateToISO());
  const [weightKg, setWeightKg] = useState(initialWeight || profile?.current_weight_kg || '');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unit = profile?.unit_system === 'imperial' ? 'lbs' : 'kg';

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toastError('Please sign in to record weight.');
      return;
    }
    if (weightKg === '' || Number(weightKg) <= 0) {
      toastError('Please enter a valid weight.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedPhotoUrl = null;
      if (photoFile) {
        const { url, error: uploadErr } = await storageService.uploadUserImage(user.id, photoFile, 'progress');
        if (uploadErr) {
          toastError('Photo upload failed: ' + uploadErr.message);
        } else {
          uploadedPhotoUrl = url;
        }
      }

      const { error } = await weightService.addWeightLog(user.id, {
        date,
        weightKg: Number(weightKg),
        bodyFatPercentage: bodyFat === '' ? null : Number(bodyFat),
        notes: notes.trim(),
        photoUrl: uploadedPhotoUrl,
      });

      if (error) {
        toastError(error.message || 'Failed to save weight entry');
      } else {
        success(`Weight logged: ${weightKg} ${unit}`);
        onWeightLogged();
        onClose();
        handleClearPhoto();
        setNotes('');
      }
    } catch (err) {
      toastError(err?.message || 'Error recording weight log');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Body Weight &amp; Progress"
      description="Record scale weight, body fat %, notes and check-in photo"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Check-in Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Scale Weight (${unit})`}
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
            leftIcon={<Scale className="w-4 h-4 text-lime" />}
            placeholder="e.g. 74.5"
            required
          />
          <Input
            label="Body Fat % (Optional)"
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value === '' ? '' : Number(e.target.value))}
            leftIcon={<Percent className="w-4 h-4 text-amber-400" />}
            placeholder="e.g. 14.5"
          />
        </div>

        <Input
          label="Check-in Notes (Optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Fasted morning weigh-in, post-cardio"
        />

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
            Progress Photo (MongoDB Private Storage)
          </label>
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video max-h-48 bg-dark-950 flex items-center justify-center">
              <ClickableImage
                src={photoPreview}
                alt="Check-in preview"
                title="Check-in photo preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleClearPhoto}
                className="absolute top-2 right-2 p-1.5 bg-dark-900/80 hover:bg-dark-900 rounded-full text-white z-10"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed border-white/15 bg-dark-950/60 hover:bg-dark-950 cursor-pointer transition-colors group">
              <Camera className="w-6 h-6 text-slate-400 group-hover:text-lime mb-1.5 transition-colors" />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                Upload check-in photo
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG or WebP under 10MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Weight Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
};
