import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Footprints, Settings, Zap, Database, Check, Server } from 'lucide-react';
import { Modal } from './Modal';

export const TopHeader = () => {
  const { isConfigured } = useAuth();
  const navigate = useNavigate();
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-dark-950/85 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 transition-all">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <Link to="/app/dashboard" className="flex items-center gap-2.5 focus:outline-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lime to-lime-bright flex items-center justify-center text-dark-950 shadow-lime-sm group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current stroke-none" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white font-sans flex items-center gap-1.5">
                FitTrack
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-lime/15 text-lime border border-lime/30">
                  MONGO
                </span>
              </span>
            </div>
          </Link>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2">
            {/* MongoDB status indicator */}
            <button
              onClick={() => setShowConfigModal(true)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                isConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title={isConfigured ? 'Connected to MongoDB & Express' : 'Local Sandbox Mode — Click to see MongoDB setup'}
            >
              <Database className="w-3 h-3" />
              <span className="hidden xs:inline">{isConfigured ? 'MongoDB Online' : 'Local Sandbox'}</span>
            </button>

            {/* Quick Activity Button */}
            <button
              onClick={() => navigate('/app/activity')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 hover:text-white transition-all text-xs font-medium focus:outline-none"
              title="Open Daily Activity & Steps Tracker"
            >
              <Footprints className="w-3.5 h-3.5 text-lime" />
              <span className="font-semibold text-white">Activity</span>
            </button>

            {/* Settings shortcut */}
            <Link
              to="/app/settings"
              className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-slate-300 hover:text-white transition-all focus:outline-none"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* MongoDB Setup Guidance Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={isConfigured ? "MongoDB Status: Connected" : "MongoDB & Express Backend Setup"}
        description="Node.js, Express, and MongoDB Architecture"
      >
        <div className="space-y-4 text-left text-sm text-slate-300">
          {isConfigured ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">MongoDB is connected and live!</p>
                <p className="text-xs mt-1 text-emerald-300/80">
                  FitTrack is communicating with your Express server and MongoDB database. All workouts, meals, and body metrics are persisted directly in MongoDB collections.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-3">
              <Server className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">Local Sandbox Mode Active</p>
                <p className="text-xs mt-1 text-amber-300/80">
                  You can use FitTrack right now with client-side persistence. To connect your live MongoDB database:
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">How to start MongoDB &amp; Express server:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
              <li>Ensure MongoDB is running locally (or get a connection string from <span className="text-lime">cloud.mongodb.com</span>).</li>
              <li>Set your connection string in <code className="text-lime bg-dark-950 px-1 py-0.5 rounded">.env</code>:
                <pre className="bg-dark-950 p-2 rounded-lg text-[11px] text-slate-300 mt-1 font-mono overflow-x-auto">
{`MONGODB_URI=mongodb://127.0.0.1:27017/fittrack
JWT_SECRET=your_secure_random_jwt_secret
PORT=5000`}
                </pre>
              </li>
              <li>Start both backend and frontend together with:
                <pre className="bg-dark-950 p-2 rounded-lg text-[11px] text-lime mt-1 font-mono">
npm run dev:all
                </pre>
              </li>
            </ol>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setShowConfigModal(false)}
              className="px-4 py-2 bg-dark-850 hover:bg-dark-800 border border-white/10 rounded-xl text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
