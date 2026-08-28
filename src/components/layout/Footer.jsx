import React from 'react';

export function Footer({ className = '' }) {
  return (
    <footer className={`py-2 px-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-wider font-medium select-none ${className}`}>
      <span>Powered by</span>
      <strong className="font-bold text-slate-700 tracking-widest">Botivate</strong>
    </footer>
  );
}
