import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt]   = useState(null);
  const [show, setShow]       = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 3 seconds
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
  };

  if (!show || !prompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="card border border-brand-500/20 p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Install WorkforcePro</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              Home screen pe add karo — fullscreen app ki tarah use karo
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShow(false)}
                className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 py-1.5 rounded-lg bg-brand-600 text-white text-xs hover:bg-brand-500 transition-colors font-medium"
              >
                Install
              </button>
            </div>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-white/20 hover:text-white p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}