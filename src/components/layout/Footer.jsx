import React from 'react';

export function Footer({ className = '' }) {
  return (
    <footer className={`py-4 px-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-wider font-medium select-none ${className}`}>
      <span>Powered by</span>
      <strong className="font-bold text-slate-800 tracking-widest">Botivate</strong>
    </footer>
  );
}
