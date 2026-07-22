import { useEffect, useMemo, useState } from 'react';
import { X, ChevronRight, Home, ArrowLeft, Folder } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useDialog } from '../context/DialogContext';
import { useI18n } from '../lib/i18n';

interface Props {
  items: FileSystemItem[];
  initialFolderId: string | null;
  title: string;
  confirmLabel: string;
  disabledIds?: Set<string>;
  onConfirm: (folderId: string | null) => void;
  onClose: () => void;
  onCreateFolder?: (name: string, parentId: string | null) => Promise<FileSystemItem>;
}

export const FolderPicker = ({
  items,
  initialFolderId,
  title,
  confirmLabel,
  disabledIds,
  onConfirm,
  onClose,
  onCreateFolder,
}: Props) => {
  const { t } = useI18n();
  const [current, setCurrent] = useState<string | null>(initialFolderId);
  const { prompt: customPrompt } = useDialog();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const folders = useMemo(
    () =>
      items
        .filter((i) => i.type === 'folder' && i.parentId === current)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items, current],
  );

  const breadcrumbs = useMemo(() => {
    const arr: FileSystemItem[] = [];
    let cur = items.find((i) => i.id === current);
    while (cur) {
      arr.unshift(cur);
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return arr;
  }, [items, current]);

  const currentFolder = items.find((i) => i.id === current);

  const handleCreate = async () => {
    if (!onCreateFolder) return;
    const name = await customPrompt(t('modal.folderName'));
    if (!name) return;
    const f = await onCreateFolder(name, current);
    setCurrent(f.id);
  };

  return (
    <div className="modal-root" onClick={onClose} data-testid="folder-picker">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-2 border-b border-neutral-200">
          {current !== null && (
            <button
              data-testid="picker-up-btn"
              onClick={() => setCurrent(currentFolder?.parentId ?? null)}
              className="p-1 hover:bg-neutral-100 rounded"
              aria-label={t('picker.up')}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0 text-sm font-medium truncate">{title}</div>
          <button data-testid="picker-close-btn" onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="px-2 py-1 text-xs text-neutral-600 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-neutral-100">
          <button
            data-testid="picker-crumb-root"
            onClick={() => setCurrent(null)}
            className="flex items-center gap-1 hover:text-neutral-900"
          >
            <Home size={12} /> Root
          </button>
          {breadcrumbs.map((b) => (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight size={12} />
              <button
                onClick={() => setCurrent(b.id)}
                className="hover:text-neutral-900 truncate max-w-[120px]"
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>

        <div className="modal-body">
          {folders.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-500">{t('picker.empty')}</div>
          ) : (
            <ul>
              {folders.map((f) => {
                const disabled = disabledIds?.has(f.id);
                return (
                  <li key={f.id}>
                    <button
                      data-testid={`picker-folder-${f.id}`}
                      disabled={disabled}
                      onClick={() => setCurrent(f.id)}
                      className={[
                        'w-full text-left px-2 py-2 text-sm flex items-center justify-between rounded',
                        disabled ? 'text-neutral-300 cursor-not-allowed' : 'hover:bg-neutral-100',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Folder size={14} className="shrink-0" strokeWidth={2} />
                        <span className="truncate">{f.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-neutral-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-2 border-t border-neutral-200">
          {onCreateFolder && (
            <button
              data-testid="picker-new-folder-btn"
              onClick={handleCreate}
              className="px-2 py-1.5 text-xs border border-neutral-200 rounded hover:bg-neutral-50"
            >
              + Folder
            </button>
          )}
          <div className="flex-1" />
          <button
            data-testid="picker-cancel-btn"
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-neutral-200 rounded hover:bg-neutral-50"
          >
            Batal
          </button>
          <button
            data-testid="picker-confirm-btn"
            onClick={() => onConfirm(current)}
            className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded hover:bg-black"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
