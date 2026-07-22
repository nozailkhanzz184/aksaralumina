import React, { useMemo, useState } from 'react';
import { X, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { AIGenFile, AIMode, FileSystemItem } from '../Types';
import {
  buildPrompt,
  callOpenRouter,
  loadKey,
  loadModel,
  parseAIResponse,
  MODE_LABELS,
} from '../lib/openrouter';
import { FolderPicker } from './FolderPicker';
import { useI18n } from '../lib/i18n';

interface Props {
  items: FileSystemItem[];
  currentFolderId: string | null;
  sourceFileIds?: string[]; // if provided, these are used as sources
  onSave: (files: AIGenFile[], targetFolderId: string | null) => Promise<void>;
  onClose: () => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<FileSystemItem>;
}

const MODES: AIMode[] = [
  'generate_command',
  'generate_command_explain',
];

export const AIHelper = ({
  items,
  currentFolderId,
  sourceFileIds,
  onSave,
  onClose,
  onCreateFolder,
}: Props) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<AIMode>('generate_command');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AIGenFile[] | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<string | null>(currentFolderId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const targetPath = useMemo(() => {
    if (target === null) return '/';
    const parts: string[] = [];
    let cur = items.find((i) => i.id === target);
    while (cur) {
      parts.unshift(cur.name);
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return '/' + parts.join('/');
  }, [items, target]);

  const run = async () => {
    setError(null);
    const storedKey = loadKey();
    const storedModel = loadModel();
    if (!storedKey.trim()) {
      setError(t('ai.emptyKey'));
      return;
    }
    if (!storedModel.trim()) {
      setError(t('ai.emptyModel'));
      return;
    }
    if (!prompt.trim()) {
      setError(t('ai.emptyPrompt'));
      return;
    }
    setLoading(true);
    try {
      const sources = sourceFileIds
        ? items
            .filter((it) => sourceFileIds.includes(it.id) && it.type === 'file')
            .map((it) => ({ name: it.name, content: it.content || '' }))
        : [];
      
      const p = buildPrompt(mode, prompt, sources);
      const txt = await callOpenRouter({ apiKey: storedKey.trim(), model: storedModel.trim(), prompt: p });
      const files = parseAIResponse(txt);
      if (!files.length) throw new Error(t('ai.noOutput'));
      setPreview(files);
      setChecked(new Set(files.map((_, i) => i)));
    } catch (e: any) {
      setError(e?.message || t('ai.failed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (i: number) => {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setChecked(next);
  };

  const saveSelected = async () => {
    if (!preview) return;
    const selected = preview.filter((_, i) => checked.has(i));
    if (!selected.length) {
      setError(t('ai.selectMinOne'));
      return;
    }
    await onSave(selected, target);
    onClose();
  };

  if (pickerOpen) {
    return (
      <FolderPicker
        items={items}
        initialFolderId={target}
        title={t('ai.target')}
        confirmLabel={t('ai.save')}
        onConfirm={(id) => {
          setTarget(id);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
        onCreateFolder={onCreateFolder}
      />
    );
  }

  return (
    <div className="modal-root" data-testid="ai-helper">
      <div className="modal-panel">
        <div className="flex items-center gap-2 p-2 border-b border-neutral-200">
          <Sparkles size={16} />
          <div className="flex-1 text-sm font-medium">AI</div>
          <button
            data-testid="ai-close-btn"
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded"
            aria-label={t('menu.close')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body flex flex-col gap-2">
          {!preview && (
            <>
              <div className="flex items-center gap-2">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as AIMode)}
                  className="w-full border border-neutral-200 rounded p-1.5 text-sm bg-white"
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {m === 'generate_command' ? t('ai.mode1') : t('ai.mode2')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <textarea
                  data-testid="ai-prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('ai.placeholder')}
                  rows={5}
                  className="border border-neutral-200 rounded p-2 text-sm resize-none w-full"
                />
              </div>

              <button
                data-testid="ai-target-btn"
                onClick={() => setPickerOpen(true)}
                className="flex items-center justify-between border border-neutral-200 rounded px-2 py-1.5 text-xs hover:bg-neutral-50"
              >
                <span className="text-neutral-500">{t('ai.target')}</span>
                <span className="flex items-center gap-1 truncate max-w-[70%]">
                  <span className="truncate font-mono">{targetPath}</span>
                  <ChevronDown size={12} />
                </span>
              </button>

              {error && (
                <div data-testid="ai-error" className="text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                data-testid="ai-run-btn"
                onClick={run}
                disabled={loading}
                className="w-full py-2 bg-neutral-900 text-white rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? t('ai.processing') : t('ai.run')}
              </button>
            </>
          )}

          {preview && (
            <>
              <div className="text-xs text-neutral-600">
                {preview.length} {t('ai.commands')} {t('ai.selectToSave')}
              </div>
              <div className="border border-neutral-200 rounded divide-y divide-neutral-100 max-h-[45vh] overflow-y-auto">
                {preview.map((f, i) => (
                  <label
                    key={i}
                    data-testid={`ai-preview-item-${i}`}
                    className="flex items-start gap-2 p-2 cursor-pointer hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      data-testid={`ai-preview-check-${i}`}
                      checked={checked.has(i)}
                      onChange={() => toggleCheck(i)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">
                        <span className="font-medium">{f.title}</span> <span className="text-neutral-400">|</span> <span className="text-neutral-500 text-[11px]">{f.content.slice(0, 240)}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  data-testid="ai-select-all"
                  onClick={() => setChecked(new Set(preview.map((_, i) => i)))}
                  className="text-[11px] px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-50"
                >
                  {t('btn.selectAll')}
                </button>
                <button
                  data-testid="ai-clear-all"
                  onClick={() => setChecked(new Set())}
                  className="text-[11px] px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-50"
                >
                  {t('btn.selectAll')}
                </button>
                <div className="flex-1" />
                <button
                  data-testid="ai-back-btn"
                  onClick={() => setPreview(null)}
                  className="text-xs px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-50"
                >
                  {t('modal.cancel')}
                </button>
              </div>

              <button
                data-testid="ai-target-btn-preview"
                onClick={() => setPickerOpen(true)}
                className="flex items-center justify-between border border-neutral-200 rounded px-2 py-1.5 text-xs hover:bg-neutral-50"
              >
                <span className="text-neutral-500">{t('ai.target')}</span>
                <span className="flex items-center gap-1 truncate max-w-[70%]">
                  <span className="truncate font-mono">{targetPath}</span>
                  <ChevronDown size={12} />
                </span>
              </button>

              {error && (
                <div data-testid="ai-error" className="text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                data-testid="ai-save-btn"
                onClick={saveSelected}
                className="w-full py-2 bg-neutral-900 text-white rounded text-sm font-medium"
              >
                Simpan {checked.size} perintah
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
