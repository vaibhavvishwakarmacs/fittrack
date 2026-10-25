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
        {/* Method 1: Apple Health 1-Tap Shortcut */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-lime/15 via-dark-900 to-dark-950 border border-lime/30 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime/20 border border-lime/40 text-lime flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-lime" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>1-Tap Apple Health Shortcut</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime text-dark-950 font-black">
                  iPhone
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Automatically read today's steps from Apple HealthKit into FitTrack
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-dark-950/80 border border-white/5 space-y-1.5 text-[11px] text-slate-300">
            <p className="font-semibold text-white">How it works in iOS Shortcuts app:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>Open the <strong>Shortcuts</strong> app on your iPhone.</li>
              <li>Create an Action: <em>"Find Health Samples where Type is Steps, Date is Today"</em>.</li>
              <li>Add Action: <em>"Open URL"</em> with your FitTrack sync link:</li>
            </ol>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${appSyncUrl}[Steps]`}
              className="flex-1 bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-lime font-mono truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleCopySyncUrl(`${appSyncUrl}[Steps]`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-xs font-bold text-white transition-all active:scale-95 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-lime" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Method 2: Direct Sync or Quick Presets */}
        <form onSubmit={handleDirectSync} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Footprints className="w-3.5 h-3.5 text-lime" />
              <span>Direct Step Sync</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Open Apple Health or Google Fit, check your steps today, and sync below:
            </p>
          </div>

          <Input
            label="Total Steps Today"
            type="number"
            placeholder={String(currentSteps || 8500)}
            value={inputSteps}
            onChange={(e) => setInputSteps(e.target.value)}
            leftIcon={<Footprints className="w-4 h-4 text-lime" />}
            required
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
                  className="py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 hover:border-lime/30 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  +{inc >= 1000 ? `${inc / 1000}k` : inc}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} size="sm">
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              className="font-bold shadow-lime-sm"
            >
              Sync Steps
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
