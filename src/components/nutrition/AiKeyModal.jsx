import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../contexts/ToastContext';
import { aiService } from '../../services/aiService';
import { Sparkles, Key, ExternalLink, Check, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react';

export const AiKeyModal = ({ isOpen, onClose, onKeySaved }) => {
  const { success, error: toastError } = useToast();
  const [geminiKey, setGeminiKey] = useState(() => aiService.getGeminiKey());
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'openai'
  const [openaiKey, setOpenaiKey] = useState(() => aiService.getOpenAIKey());
  const [showKey, setShowKey] = useState(false);

  const handleClear = () => {
    aiService.setGeminiKey('');
    setGeminiKey('');
    success('Device key cleared. Using server configuration.');
    if (onKeySaved) {
      onKeySaved('');
    }
    onClose();
  };

  const handleSave = (e) => {
    e?.preventDefault();
    if (provider === 'gemini') {
      let clean = geminiKey.trim();
      clean = clean.replace(/^(GEMINI_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*/i, '');
      clean = clean.replace(/^["']|["']$/g, '').trim();

      if (!clean) {
        toastError('Please enter a valid Gemini API key.');
        return;
      }
      if (clean.endsWith('...')) {
        toastError('This key appears truncated (copied from a dashboard preview with ...). Please copy the entire key.');
        return;
      }
      if (clean.length < 35) {
        toastError(`Key is too short (${clean.length} characters). A full Gemini key is 39+ characters.`);
        return;
      }

      aiService.setGeminiKey(clean);
      success('Google Gemini AI connected! 1,500 free daily nutrition scans enabled.');
      if (onKeySaved) {
        onKeySaved(clean);
      }
    } else {
      if (!openaiKey.trim()) {
        toastError('Please enter a valid OpenAI API key.');
        return;
      }
      aiService.setOpenAIKey(openaiKey.trim());
      success('OpenAI Vision connected successfully!');
      if (onKeySaved) {
        onKeySaved(openaiKey.trim());
      }
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Free AI Nutrition Vision"
      description="Scan any meal or product photo to instantly calculate calories, serving grams, and macros"
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4 text-left">
        {/* Highlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-lime/15 via-emerald-950/30 to-dark-900 border border-lime/30 shadow-[0_0_20px_rgba(187,244,61,0.1)] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime/20 border border-lime/40 text-lime flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Google Gemini Flash (100% Free)</h4>
              <p className="text-[11px] text-slate-300">
                1,500 free food image scans per day with zero cost. No credit card required.
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-lime text-dark-950 font-black text-xs hover:bg-lime-bright transition-all shadow-lime-sm active:scale-95"
          >
            <span>Get Free Gemini Key in 10s (Google AI Studio)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Provider Switch Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/5">
          <button
            type="button"
            onClick={() => setProvider('gemini')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              provider === 'gemini'
                ? 'bg-lime text-dark-950 shadow-lime-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google Gemini (Free)
          </button>
          <button
            type="button"
            onClick={() => setProvider('openai')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              provider === 'openai'
                ? 'bg-lime text-dark-950 shadow-lime-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OpenAI / ChatGPT
          </button>
        </div>

        {/* Key Input */}
        {provider === 'gemini' ? (
          <div>
            <Input
              label="Google Gemini API Key"
              type={showKey ? 'text' : 'password'}
              placeholder="Paste your key (AQ... or AIza...)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              helperText="Paste your key from Google AI Studio. Stored securely on your device."
              leftIcon={<Key className="w-4 h-4 text-lime" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
        ) : (
          <div>
            <Input
              label="OpenAI API Key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              helperText="Your OpenAI key with GPT-4o-mini vision permissions."
              leftIcon={<Key className="w-4 h-4 text-sky-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
        )}

        <div className="pt-2 flex justify-between items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" onClick={onClose} size="sm">
              Cancel
            </Button>
            {Boolean(aiService.getGeminiKey()) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 underline transition-colors"
              >
                Clear Key
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Check className="w-4 h-4" />}
            className="font-bold shadow-lime-sm"
          >
            Save &amp; Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
};
