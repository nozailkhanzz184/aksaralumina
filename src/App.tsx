import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  Search,
  FolderPlus,
  FilePlus,
  Sparkles,
  Home,
  ChevronRight,
  X,
  Trash2,
  Copy,
  Move,
  ListChecks,
  ListOrdered,
  Shield,
  Layers,
  Eraser,
  Settings,
  Menu,
  PanelLeft,
  Bell,
  Languages,
  Aperture
} from 'lucide-react';
import { AppLogo } from './components/AppLogo';

import { FileBrowser } from './components/FileBrowser';
import { ItemMenu, MenuAction } from './components/ItemMenu';
import { DuplicateDialog } from './components/DuplicateDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { LoginScreen } from './components/LoginScreen';
import { useDialog } from './context/DialogContext';

import { useFileSystem } from './hooks/useFileSystem';
import { useAppwriteSync } from './hooks/useAppwriteSync';
import { useI18n } from './lib/i18n';

import { FileSystemItem, AIGenFile } from './Types';

// Lazy-load komponen berat: hanya di-fetch saat pertama kali dibutuhkan.
const Editor = lazy(() => import('./components/Editor').then((m) => ({ default: m.Editor })));
const AIHelper = lazy(() =>
  import('./components/AIHelper').then((m) => ({ default: m.AIHelper })),
);
const FolderPicker = lazy(() =>
  import('./components/FolderPicker').then((m) => ({ default: m.FolderPicker })),
);

export default function App() {
  const fs = useFileSystem();
  const { alert: customAlert, confirm: customConfirm, prompt: customPrompt } = useDialog();
  const {
    items,
    loaded,
    currentFolderId,
    setCurrentFolderId,
    currentItems,
    createItem,
    updateContent,
    renameItem,
    deleteMany,
    moveMany,
    copyMany,
    reorderInParent,
    childrenOf,
    getBreadcrumbs,
    searchItems,
    pathOf,
    exportJSON,
    importJSON,
    importItems,
    findDuplicates,
  } = fs;

  const [query, setQuery] = useState('');
  const [openFile, setOpenFile] = useState<FileSystemItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [keepSelectMode, setKeepSelectMode] = useState(false);
  const [menuFor, setMenuFor] = useState<FileSystemItem | null>(null);
  const [pickerConfig, setPickerConfig] = useState<
    | null
    | {
        title: string;
        confirmLabel: string;
        disabledIds?: Set<string>;
        onConfirm: (folderId: string | null) => Promise<void> | void;
      }
  >(null);
  const [aiOpen, setAIOpen] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<null | { duplicates: string[][]; items: FileSystemItem[] }>(null);
  const [aiSources, setAISources] = useState<string[] | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const { lang, setLang, t } = useI18n();
  
  const { user, loading, syncing, login, register, resetPassword, updatePasswordRecovery, logout, syncData, overwriteCloudData } = useAppwriteSync(
    items,
    importJSON,
    exportJSON
  );

  const selectMode = selectedIds.size > 0 || keepSelectMode;

  const showToast = useCallback((msg: string) => {
    sonnerToast(msg, { duration: 2000 });
  }, []);

  const breadcrumbs = getBreadcrumbs();
  const searchMode = query.trim().length > 0;
  const listItems = useMemo(
    () => (searchMode ? searchItems(query) : currentItems),
    [searchMode, query, searchItems, currentItems],
  );

  useEffect(() => {
    if (selectMode) {
      const filter = searchMode
        ? new Set(listItems.map((i) => i.id))
        : new Set(currentItems.map((i) => i.id));
      const kept = new Set<string>();
      selectedIds.forEach((id) => {
        if (filter.has(id)) kept.add(id);
      });
      if (kept.size !== selectedIds.size) setSelectedIds(kept);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, searchMode]);

  const navigateTo = (id: string | null) => {
    setCurrentFolderId(id);
    setQuery('');
    setSelectedIds(new Set());
  };

  const handleNewFolder = async () => {
    const name = await customPrompt(t('modal.folderName'));
    if (name && name.trim()) await createItem(name.trim(), 'folder', currentFolderId);
  };

  const handleNewFile = () => {
    setOpenFile({
      id: 'temp',
      parentId: currentFolderId,
      name: '',
      type: 'file',
      content: '',
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const copyFileToClipboard = async (item: FileSystemItem) => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      showToast(t('toast.copied'));
    } catch {
      showToast(t('toast.copyFailed'));
    }
  };

  const toggleSelectAllHeader = () => {
    if (listItems.length === 0) return;
    if (!selectMode) {
      // Klik pertama: hanya masuk mode pilih (0 dipilih) — user tap satu-satu
      setKeepSelectMode(true);
      setSelectedIds(new Set());
      return;
    }
    const allIds = listItems.map((i) => i.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      // Sudah semua → kosongkan
      setKeepSelectMode(true);
      setSelectedIds(new Set());
    } else {
      // Belum semua → pilih semua
      setKeepSelectMode(true);
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleSelect = (id: string) => {
    // Tetap di mode pilih walau semua ter-deselect,
    // sehingga selection bar & tombol tidak hilang saat user salah pilih.
    setKeepSelectMode(true);
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setKeepSelectMode(false);
    setSelectedIds(new Set());
  };

  const disabledFolderIds = (movingIds: string[]): Set<string> => {
    // Cannot move into itself or its descendants.
    const disabled = new Set<string>(movingIds);
    const walk = (id: string) => {
      items.filter((i) => i.parentId === id).forEach((c) => {
        if (!disabled.has(c.id)) {
          disabled.add(c.id);
          walk(c.id);
        }
      });
    };
    movingIds.forEach(walk);
    return disabled;
  };

  const openMovePicker = (ids: string[]) => {
    setPickerConfig({
      title: `Pindahkan ${ids.length} item`,
      confirmLabel: t('action.move'),
      disabledIds: disabledFolderIds(ids),
      onConfirm: async (target) => {
        await moveMany(ids, target);
        clearSelection();
        showToast(t('toast.moved'));
      },
    });
  };

  const openCopyPicker = (ids: string[]) => {
    setPickerConfig({
      title: `Salin ${ids.length} item`,
      confirmLabel: t('action.copy'),
      onConfirm: async (target) => {
        await copyMany(ids, target);
        clearSelection();
        showToast(t('toast.copied'));
      },
    });
  };

  const guardedDelete = async (
    ids: string[],
    opts?: { title?: string; afterDelete?: () => void },
  ) => {
    if (!ids.length) return;
    const afterDelete = opts?.afterDelete;
    
    let targetName = 'item';
    if (ids.length === 1) {
      const targetItem = items.find((i) => i.id === ids[0]);
      if (targetItem) {
        if (targetItem.type === 'folder') {
          targetName = targetItem.name || t('picker.newFolder');
        } else {
          targetName = targetItem.content?.split('\n').find((l) => l.trim()) || targetItem.name || '(tanpa nama)';
        }
      }
      if (targetName.length > 30) {
        targetName = targetName.substring(0, 30) + '...';
      }
    }

    const title =
      opts?.title ||
      (ids.length === 1
        ? `Hapus "${targetName}"?`
        : `Hapus ${ids.length} item?`);

    const performDelete = async () => {
      await deleteMany(ids);
      clearSelection();
      showToast(t('toast.deleted'));
      afterDelete?.();
    };

    if (await customConfirm(title)) {
      performDelete();
    }
  };

  const bulkDelete = () => {
    const ids = [...selectedIds];
    guardedDelete(ids);
  };

  const bulkReorder = async () => {
    if (searchMode) {
      showToast(t('toast.cantMoveSearch'));
      return;
    }
    const targetNumber = await customPrompt('' + t('modal.moveTo') + '' + listItems.length + '):');
    if (targetNumber) {
      const targetIdx = parseInt(targetNumber, 10) - 1;
      if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < listItems.length) {
        const idsToMove = [...selectedIds];
        let currentIds = listItems.map((i) => i.id);
        
        // Hapus semua id yang dipilih dari urutan saat ini
        currentIds = currentIds.filter(id => !idsToMove.includes(id));
        
        // Sisipkan item yang dipilih pada index yang dituju
        const safeIdx = Math.min(targetIdx, currentIds.length);
        currentIds.splice(safeIdx, 0, ...idsToMove);

        await reorderInParent(currentFolderId, currentIds);
        clearSelection();
      }
    }
  };

  
  const handleExport = () => {
    const data = exportJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aksaralumina.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('settings.export.success') || 'Exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast(t('settings.import.tooLarge') || 'File too large (Max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (re) => {
        const content = re.target?.result as string;
        if (content) {
          if (await customConfirm(t('settings.import.replace') || 'Replace existing data? Cancel to merge.')) {
            await importJSON(content, true);
          } else {
            await importJSON(content, false);
          }
          showToast(t('settings.import.success') || 'Imported successfully');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSyncMerge = async () => {
    if (await customConfirm(t('btn.syncMerge') + '?')) {
      await syncData();
    }
  };

  const handleSyncOverwrite = async () => {
    if (await customConfirm(t('btn.syncOverwrite') + '?')) {
      await overwriteCloudData();
    }
  };

  const handleDeleteDuplicates = () => {
    const dups = findDuplicates();
    if (dups.length > 0) {
      setDuplicateDialog({ duplicates: dups, items: items });
    } else {
      showToast(t('toast.noDuplicates'));
    }
  };

  const openAIForItems = (ids?: string[]) => {
    setAISources(ids && ids.length ? ids : undefined);
    setAIOpen(true);
  };

  const handleAISave = async (files: AIGenFile[], targetFolderId: string | null) => {
    for (const f of files) {
      await createItem(f.title, 'file', targetFolderId, f.content);
    }
    clearSelection();
    showToast(`${files.length} ${t("toast.aiSaved")}`);
  };

  const onDropOnFolder = async (targetFolderId: string, draggedIds: string[]) => {
    await moveMany(draggedIds, targetFolderId);
    clearSelection();
  };

  const onReorder = async (draggedIds: string[], overId: string, position: 'before' | 'after') => {
    const overItem = items.find((i) => i.id === overId);
    if (!overItem) return;
    const parentId = overItem.parentId;
    // Move dragged to same parent first, then reorder
    const draggedInDifferentParent = draggedIds.filter((id) => {
      const it = items.find((i) => i.id === id);
      return it && it.parentId !== parentId;
    });
    if (draggedInDifferentParent.length) {
      await moveMany(draggedInDifferentParent, parentId);
    }
    // After state update, use current siblings recomputed
    setTimeout(async () => {
      const siblings = childrenOf(parentId).filter((i) => !draggedIds.includes(i.id));
      const overIdx = siblings.findIndex((i) => i.id === overId);
      const insertAt = position === 'before' ? overIdx : overIdx + 1;
      const draggedItems = draggedIds
        .map((id) => items.find((i) => i.id === id))
        .filter(Boolean) as FileSystemItem[];
      const ordered = [...siblings.slice(0, insertAt), ...draggedItems, ...siblings.slice(insertAt)];
      await reorderInParent(parentId, ordered.map((i) => i.id));
    }, 0);
  };

  const openItemMenu = (item: FileSystemItem) => {
    setMenuFor(item);
  };

  const menuActions = (item: FileSystemItem): MenuAction[] => {
    const list: MenuAction[] = [];
    list.push({
      key: 'reorder',
      label: t('action.moveToNum'),
      onClick: async () => {
        const targetNumber = await customPrompt('' + t('modal.moveTo') + '' + listItems.length + '):');
        if (targetNumber) {
          const targetIdx = parseInt(targetNumber, 10) - 1;
          if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < listItems.length) {
            const currentIndex = listItems.findIndex((i) => i.id === item.id);
            const currentIds = listItems.map((i) => i.id);
            const newIds = [...currentIds];
            newIds.splice(currentIndex, 1);
            newIds.splice(targetIdx, 0, item.id);
            reorderInParent(item.parentId, newIds);
          }
        }
      },
    });
    list.push({ key: 'move', label: t('action.moveToFolder'), onClick: () => openMovePicker([item.id]) });
    if (item.type === 'folder') {
      list.push({
        key: 'rename',
        label: t('action.rename'),
        onClick: async () => {
          const n = await customPrompt('' + t('modal.newName') + '', item.name);
          if (n && n.trim()) renameItem(item.id, n.trim());
        },
      });
    }
    list.push({
      key: 'delete',
      label: t('action.delete'),
      danger: true,
      onClick: () => guardedDelete([item.id]),
    });
    return list;
  };

  if (loading || !user) {
    return <LoginScreen login={login} register={register} resetPassword={resetPassword} updatePasswordRecovery={updatePasswordRecovery} loading={loading} />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        ...
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#f0f2f5] text-neutral-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            data-testid="settings-btn"
            onClick={() => setSettingsOpen(true)}
            className="text-neutral-900 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors"
            aria-label={t('file.menu')}
            title={t('file.menu')}
          >
            <PanelLeft size={24} />
          </button>
          <a href="#" className="flex items-center gap-2 text-neutral-900 text-xl font-semibold tracking-wide no-underline select-none">
            <AppLogo size={24} className="text-neutral-900" />
            Aksara<span className="text-neutral-400 font-normal">Lumina</span>
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 relative">
          <div className="relative">
            <button 
              className="text-neutral-900 hover:bg-neutral-100 p-2 rounded-full transition-all relative"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowLanguageMenu(false);
              }}
            >
              <Bell size={22} />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-4 animate-in fade-in slide-in-from-top-2">
                <h3 className="font-semibold text-neutral-900 mb-2">{t('notif.title')}</h3>
                <p className="text-sm text-neutral-500">{t('notif.empty')}</p>
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              className="text-neutral-900 hover:bg-neutral-100 p-2 rounded-full transition-all"
              onClick={() => {
                setShowLanguageMenu(!showLanguageMenu);
                setShowNotifications(false);
              }}
            >
              <Languages size={22} />
            </button>
            {showLanguageMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 mb-1">{t('lang.title')}</div>
                {[
                  { id: 'id', label: 'Bahasa Indonesia' },
                  { id: 'en', label: 'English' },
                  { id: 'zh-CN', label: '简体中文' },
                  { id: 'fr', label: 'Français' },
                  { id: 'ja', label: '日本語' },
                  { id: 'vi', label: 'Tiếng Việt' },
                  { id: 'zh-TW', label: '繁體中文' }
                ].map((l) => (
                  <button
                    key={l.id}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${lang === l.id ? 'font-medium text-pink-600 bg-pink-50/50' : 'text-neutral-700'}`}
                    onClick={() => { setLang(l.id as any); setShowLanguageMenu(false); }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col gap-4 relative">
        <div className="border border-neutral-200 rounded-lg p-2 bg-white flex flex-col gap-2 sticky top-[72px] z-30 shadow-sm">
          {/* Top Row: Search + Folder + File */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-1.5 bg-white">
              <Search size={18} className="text-neutral-400 shrink-0" />
              <input
                data-testid="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="flex-1 text-base bg-transparent focus:outline-none"
              />
              {query && (
                <button
                  data-testid="search-clear"
                  onClick={() => setQuery('')}
                  className="p-1 text-neutral-400 hover:text-neutral-800"
                  aria-label={t('action.delete')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              data-testid="new-folder-btn"
              onClick={handleNewFolder}
              className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700"
              title={t('btn.newFolder')}
            >
              <FolderPlus size={20} />
            </button>
            <button
              data-testid="new-file-btn"
              onClick={handleNewFile}
              className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700"
              title={t('btn.newFile')}
            >
              <FilePlus size={20} />
            </button>
          </div>

          {/* Bottom Row: Breadcrumb + Tools */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar text-sm font-medium">
              <button
                data-testid="crumb-root"
                onClick={() => navigateTo(null)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-100"
              >
                <Home size={16} /> Root
              </button>
              {breadcrumbs.map((b) => (
                <div key={b.id} className="inline-flex items-center gap-1.5">
                  <ChevronRight size={14} className="text-neutral-400" />
                  <button
                    data-testid={`crumb-${b.id}`}
                    onClick={() => navigateTo(b.id)}
                    className="px-2 py-1 rounded hover:bg-neutral-100 truncate max-w-[140px]"
                  >
                    {b.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                data-testid="select-all-header-btn"
                onClick={toggleSelectAllHeader}
                disabled={listItems.length === 0}
                className={[
                  'p-1.5 rounded disabled:opacity-40 disabled:hover:bg-transparent transition-colors',
                  selectMode ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700',
                ].join(' ')}
                title={t('btn.selectAll')}
              >
                <ListChecks size={18} />
              </button>
              <button
                data-testid="delete-duplicates-btn"
                onClick={handleDeleteDuplicates}
                className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 transition-colors"
                title={t('btn.removeDuplicates')}
              >
                <Layers size={18} />
              </button>
              <button
                data-testid="ai-btn"
                onClick={() => setAIOpen(true)}
                className="p-1.5 hover:bg-neutral-100 rounded text-neutral-700 transition-colors"
                title={t('btn.generateCommand')}
              >
                <Sparkles size={18} />
              </button>
              {user && (
                <>

                </>
              )}
            </div>
          </div>
        </div>

      {/* Selection toolbar */}
      {selectMode && (
        <div
          data-testid="selection-bar"
          className="mt-2 border border-neutral-200 rounded-lg p-2 bg-white flex items-center gap-1.5 sticky top-[92px] z-20"
        >
          <div className="text-xs font-medium" data-testid="selection-count">
            {selectedIds.size} dipilih
          </div>
          <div className="flex-1" />
          <button
            data-testid="bulk-move-btn"
            onClick={() => openMovePicker([...selectedIds])}
            className="p-1 hover:bg-neutral-100 rounded"
            aria-label={t('action.move')}
            title={t('action.move')}
          >
            <Move size={16} />
          </button>
          <button
            data-testid="bulk-copy-btn"
            onClick={() => openCopyPicker([...selectedIds])}
            className="p-1 hover:bg-neutral-100 rounded"
            aria-label={t('action.copy')}
            title={t('action.copy')}
          >
            <Copy size={16} />
          </button>
          <button
            data-testid="bulk-reorder-btn"
            onClick={bulkReorder}
            className="p-1 hover:bg-neutral-100 rounded"
            aria-label={t('action.moveToNum')}
            title={t('action.moveToNum')}
          >
            <ListOrdered size={16} />
          </button>
          <button
            data-testid="bulk-delete-btn"
            onClick={bulkDelete}
            className="p-1 hover:bg-neutral-100 rounded text-red-600"
            aria-label={t('action.delete')}
            title={t('action.delete')}
          >
            <Trash2 size={16} />
          </button>
          <button
            data-testid="clear-selection-btn"
            onClick={clearSelection}
            className="p-1 hover:bg-neutral-100 rounded"
            aria-label={t('action.cancel')}
            title={t('action.cancel')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* List */}
      <div className="mt-2 border border-neutral-200 rounded-lg bg-white overflow-hidden">
        <FileBrowser
          items={listItems}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onOpenFolder={(id) => navigateTo(id)}
          onCopyFile={copyFileToClipboard}
          onOpenFile={(it) => setOpenFile(it)}
          onMenu={(it) => openItemMenu(it)}
          onDropOnFolder={onDropOnFolder}
          onReorder={onReorder}
          emptyLabel={searchMode ? t('empty.search') : t('empty.folder')}
          searchMode={searchMode}
          pathOf={pathOf}
        />
      </div>

      {menuFor && (
        <ItemMenu
          title={
            menuFor.type === 'file'
              ? (menuFor.content || '').split('\n').find((l) => l.trim()) || '(kosong)'
              : menuFor.name || t('picker.newFolder')
          }
          actions={menuActions(menuFor)}
          onClose={() => setMenuFor(null)}
        />
      )}

      <Suspense fallback={null}>
        {pickerConfig && (
          <FolderPicker
            items={items}
            initialFolderId={currentFolderId}
            title={pickerConfig.title}
            confirmLabel={pickerConfig.confirmLabel}
            disabledIds={pickerConfig.disabledIds}
            onConfirm={async (id) => {
              await pickerConfig.onConfirm(id);
              setPickerConfig(null);
            }}
            onClose={() => setPickerConfig(null)}
            onCreateFolder={(name, parentId) => createItem(name, 'folder', parentId)}
          />
        )}

        {openFile && (
          <Editor
            item={openFile}
            onRename={async (id, newName) => {
              await renameItem(id, newName);
              setOpenFile((prev) => (prev ? { ...prev, name: newName } : null));
            }}
            onSave={async (id, content) => {
              if (id === 'temp') {
                if (content.trim()) {
                  try {
                    await createItem(
                      openFile.name,
                      'file',
                      currentFolderId,
                      content,
                    );
                  } catch (e: any) {
                    showToast(e.message);
                  }
                }
              } else {
                await updateContent(id, content);
              }
            }}
            onClose={() => setOpenFile(null)}
            onDelete={(id) => {
              setOpenFile(null);
              guardedDelete([id]);
            }}
          />
        )}

        {aiOpen && (
          <AIHelper
            items={items}
            currentFolderId={currentFolderId}
            sourceFileIds={aiSources}
            onSave={handleAISave}
            onClose={() => {
              setAIOpen(false);
              setAISources(undefined);
            }}
            onCreateFolder={(name, parentId) => createItem(name, 'folder', parentId)}
          />
        )}
        {duplicateDialog && (
          <DuplicateDialog
            duplicates={duplicateDialog.duplicates}
            items={duplicateDialog.items}
            onClose={() => setDuplicateDialog(null)}
            onConfirm={(toDelete) => {
              guardedDelete(toDelete);
              setDuplicateDialog(null);
            }}
            pathOf={pathOf}
          />
        )}
        
        {settingsOpen && (
          <SettingsDialog
            user={user}
            loading={loading}
            syncing={syncing}
            logout={logout}
            onClose={() => setSettingsOpen(false)}
            onSyncMerge={handleSyncMerge}
            onSyncOverwrite={handleSyncOverwrite}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
      </Suspense>
      </main>
    </div>
  );
}
