import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';

interface DialogConfig {
  type: 'alert' | 'confirm' | 'prompt';
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
}

interface DialogContextType {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({ type: 'alert', message, resolve });
    });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ type: 'confirm', message, resolve });
    });
  };

  const showPrompt = (message: string, defaultValue = ''): Promise<string | null> => {
    setInputValue(defaultValue);
    return new Promise((resolve) => {
      setDialog({ type: 'prompt', message, defaultValue, resolve });
    });
  };

  const handleOk = () => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      dialog.resolve(inputValue);
    } else if (dialog.type === 'confirm') {
      dialog.resolve(true);
    } else {
      dialog.resolve(undefined);
    }
    setDialog(null);
    setInputValue('');
  };

  const handleCancel = () => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      dialog.resolve(null);
    } else if (dialog.type === 'confirm') {
      dialog.resolve(false);
    }
    setDialog(null);
    setInputValue('');
  };

  useEffect(() => {
    if (dialog && dialog.type === 'prompt') {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [dialog]);

  return (
    <DialogContext.Provider value={{ alert: showAlert, confirm: showConfirm, prompt: showPrompt }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-xs">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 flex-1">
              <p className="text-sm font-medium text-neutral-900 whitespace-pre-wrap">{dialog.message}</p>
              {dialog.type === 'prompt' && (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="mt-3 w-full border border-neutral-200 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOk();
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
              )}
            </div>
            <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-100 flex justify-end gap-2">
              {dialog.type !== 'alert' && (
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={handleOk}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-950 text-white rounded hover:bg-neutral-800 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
