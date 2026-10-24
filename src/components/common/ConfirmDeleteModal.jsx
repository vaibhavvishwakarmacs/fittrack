import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trash2, AlertTriangle } from 'lucide-react';

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Entry',
  itemName,
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  isDeleting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center p-2 pt-0 space-y-4">
        {/* Danger Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <Trash2 className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
          {itemName && (
            <p className="text-sm font-bold text-rose-300/90 mt-1 truncate max-w-xs">
              "{itemName}"
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isDeleting}
            className="w-full justify-center font-bold text-xs py-2.5 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
          >
            Yes, Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
