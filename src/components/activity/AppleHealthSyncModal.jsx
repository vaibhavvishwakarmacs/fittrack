import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../contexts/ToastContext';
import {
  Smartphone,
  Apple,
  ExternalLink,
  Copy,
  Check,
  Footprints,
  Sparkles,
  Zap,
} from 'lucide-react';

import { getAuthToken } from '../../lib/api';

export const AppleHealthSyncModal = ({
  isOpen,
  onClose,
  onSyncSteps,
  currentSteps = 0,
}) => {
  const { success, error: toastError } = useToast();
  const [inputSteps, setInputSteps] = useState('');
  const [copied, setCopied] = useState(false);
  const token = getAuthToken();

  // Shortcut sync URL formats
  const appSyncUrl = typeof window !== 'undefined' ? `${window.location.origin}/app/activity?sync_steps=` : '';
  const backgroundApiUrl = typeof window !== 'undefined' && token
    ? `${window.location.origin}/api/activity/sync?token=${token}&steps=`
    : appSyncUrl;

  const handleCopySyncUrl = (urlToCopy) => {
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    success('Sync URL copied! Paste into Apple Shortcuts app.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickPreset = (amount) => {
    setInputSteps(String((Number(inputSteps) || currentSteps) + amount));
  };

  const handleDirectSync = (e) => {
    e.preventDefault();
    const s = Number(inputSteps);
    if (isNaN(s) || s < 0) {
      toastError('Please enter a valid step count.');
      return;
    }
    onSyncSteps(s);
    success(`Synced ${s.toLocaleString()} steps!`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apple Health &amp; Android Step Sync"
      description="Keep your daily steps accurate from your iPhone Health or Android phone"
      maxWidth="md"
    >
      <div className="space-y-4 text-left">
        {/* Primary: Direct Step Sync (Fastest & Guaranteed to Work) */}
        <form onSubmit={handleDirectSync} className="p-4 rounded-2xl bg-gradient-to-br from-lime/10 via-dark-900 to-dark-950 border border-lime/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-lime" />
                <span>Enter Apple Health Steps</span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Check steps in your iPhone Health app and enter or tap a preset:
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime text-dark-950">
              Instant
            </span>
          </div>

          <Input
            label="Total Steps Today"
            type="number"
            placeholder={String(currentSteps || 8500)}
            value={inputSteps}
            onChange={(e) => setInputSteps(e.target.value)}
            leftIcon={<Footprints className="w-4 h-4 text-lime" />}
            required
            autoFocus
          />

          {/* Quick Step Chips */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Presets
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1000, 2500, 5000, 10000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickPreset(inc)}
                  className="py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 hover:border-lime/40 text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95"
                >
                  +{inc >= 1000 ? `${inc / 1000}k` : inc}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              className="font-bold shadow-lime-sm"
            >
              Save Steps Now
            </Button>
          </div>
        </form>

        {/* Secondary: Automated Background Shortcut Info */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h5 className="font-bold text-white text-xs">Want it 100% automated?</h5>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            iPhone only allows native App Store apps under "Open App". Web apps (PWAs) cannot be opened directly from that block. The direct sync above is the fastest 1-second way!
          </p>
        </div>
      </div>
    </Modal>
  );
};
