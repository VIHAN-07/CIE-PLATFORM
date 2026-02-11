// ==========================================
// Modal Component — Reusable dialog
// ==========================================

import { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

export default function Modal({ show, onClose, title, children, wide = false }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (show) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Content */}
      <div className={`relative bg-white rounded-2xl shadow-xl z-10 mx-4 ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
