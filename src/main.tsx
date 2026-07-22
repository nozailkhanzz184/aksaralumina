import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { polyfill as mobileDndPolyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';
import { DialogProvider } from './context/DialogContext';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './lib/i18n';

// Migrasi localStorage lama (simpanteks:*) → nama baru (aksaralumina:*)
try {
  const migrated = localStorage.getItem('aksaralumina:migrated');
  if (!migrated) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('simpanteks:')) {
        const val = localStorage.getItem(key);
        if (val !== null) localStorage.setItem(key.replace('simpanteks:', 'aksaralumina:'), val);
      }
    }
    // Hapus key lama
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('simpanteks:')) toDelete.push(key);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('aksaralumina:migrated', '1');
  }
} catch {
  /* ignore */
}

mobileDndPolyfill({
  holdToDrag: 300,
  dragImageTranslateOverride: undefined as unknown as never,
});
window.addEventListener('touchmove', () => {}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <DialogProvider>
          <Toaster position="top-center" richColors duration={2000} toastOptions={{ duration: 2000 }} />
          <App />
        </DialogProvider>
      </I18nProvider>
    </ErrorBoundary>
  </StrictMode>,
);
