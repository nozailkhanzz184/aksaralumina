import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Trash2, Edit2, Type } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useDialog } from '../context/DialogContext';
import { useI18n } from '../lib/i18n';

interface Props {
  item: FileSystemItem;
  onSave: (id: string, content: string) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

export const Editor = ({ item, onSave, onClose, onDelete, onRename }: Props) => {
  const { t } = useI18n();
  const [content, setContent] = useState(item.content || '');
  const { prompt: customPrompt } = useDialog();
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => {
    onSave(item.id, content);
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className="editor-root" data-testid="editor-root">
      <div className="flex items-center gap-2 p-2 border-b border-neutral-200 bg-white">
        <button
          data-testid="editor-back-btn"
          onClick={handleClose}
          className="p-1 hover:bg-neutral-100 rounded shrink-0"
          aria-label={t('menu.close')}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0" data-testid="editor-title">
        </div>
        {onDelete && (
          <button
            data-testid="editor-delete-btn"
            onClick={() => {
              onDelete(item.id);
            }}
            className="p-1 hover:bg-neutral-100 rounded text-red-600 shrink-0"
            aria-label={t('modal.delete')}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <textarea
        ref={ref}
        data-testid="editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('editor.placeholder')}
        spellCheck={false}
        className="flex-1 w-full p-3 text-sm resize-none focus:outline-none font-mono leading-relaxed"
      />
    </div>
  );
};
