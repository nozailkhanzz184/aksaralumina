import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Folder, Trash2, RotateCcw, FileText } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useI18n } from '../lib/i18n';

interface Props {
  items: FileSystemItem[];
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onCopyFile: (item: FileSystemItem) => void;
  onOpenFile: (item: FileSystemItem) => void;
  onMenu: (item: FileSystemItem, anchor: DOMRect) => void;
  onDropOnFolder: (targetFolderId: string, draggedIds: string[]) => void;
  onReorder: (draggedIds: string[], overId: string, position: 'before' | 'after') => void;
  emptyLabel?: string;
  searchMode?: boolean;
  pathOf?: (id: string | null) => string;
  inTrash?: boolean;
  trashCount?: number;
  onRestoreTrash?: (id: string) => void;
}

export const FileBrowser = ({
  items,
  selectMode,
  selectedIds,
  onToggleSelect,
  onOpenFolder,
  onCopyFile,
  onOpenFile,
  onMenu,
  onDropOnFolder,
  onReorder,
  emptyLabel,
  searchMode = false,
  pathOf,
  inTrash = false,
  trashCount = 0,
  onRestoreTrash,
}: Props) => {
  const { t } = useI18n();
  const label = emptyLabel || t('empty.folder');
  if (items.length === 0) {
    return (
      <div
        data-testid="empty-state"
        className="py-16 text-center text-sm text-neutral-500"
      >
        {emptyLabel}
      </div>
    );
  }
  let fileIndex = 0;
  return (
    <ul data-testid="file-list" className="flex flex-col">
      {items.map((it) => {
        const isTrash = it.id === '__TRASH_FOLDER__';
        if (!isTrash) {
          fileIndex++;
        }
        return (
          <Row
            key={it.id}
            number={isTrash ? 0 : fileIndex}
            isTrash={isTrash}
            trashCount={trashCount}
            item={it}
            selected={selectedIds.has(it.id)}
            selectMode={selectMode}
            onToggleSelect={() => {
              if (isTrash) return;
              onToggleSelect(it.id);
            }}
            onOpenFolder={() => onOpenFolder(it.id)}
            onCopyFile={() => onCopyFile(it)}
            onOpenFile={() => onOpenFile(it)}
            onMenu={(rect) => onMenu(it, rect)}
            onDropOnFolder={(dragged) => onDropOnFolder(it.id, dragged)}
            onReorder={(dragged, pos) => onReorder(dragged, it.id, pos)}
            allSelectedIds={selectedIds}
            searchMode={searchMode}
            pathLabel={pathOf ? pathOf(it.parentId) : undefined}
            inTrash={inTrash}
            onRestoreTrash={onRestoreTrash}
          />
        );
      })}
    </ul>
  );
};

interface RowProps {
  number: number;
  isTrash: boolean;
  trashCount: number;
  item: FileSystemItem;
  selected: boolean;
  selectMode: boolean;
  allSelectedIds: Set<string>;
  onToggleSelect: () => void;
  onOpenFolder: () => void;
  onCopyFile: () => void;
  onOpenFile: () => void;
  onMenu: (rect: DOMRect) => void;
  onDropOnFolder: (draggedIds: string[]) => void;
  onReorder: (draggedIds: string[], position: 'before' | 'after') => void;
  searchMode: boolean;
  pathLabel?: string;
  inTrash?: boolean;
  onRestoreTrash?: (id: string) => void;
}

const Row = ({
  number,
  isTrash,
  trashCount,
  item,
  selected,
  selectMode,
  allSelectedIds,
  onToggleSelect,
  onOpenFolder,
  onCopyFile,
  onOpenFile,
  onMenu,
  onDropOnFolder,
  onReorder,
  searchMode,
  pathLabel,
  inTrash = false,
  onRestoreTrash,
}: RowProps) => {
  const { t } = useI18n();
  const [dropZone, setDropZone] = useState<'over' | 'top' | 'bottom' | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);

  const handleClick = () => {
    if (isTrash) {
      onOpenFolder();
      return;
    }
    if (selectMode) {
      onToggleSelect();
      return;
    }
    if (item.type === 'folder') onOpenFolder();
    else onCopyFile();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isTrash) {
      e.preventDefault();
      return;
    }
    const ids = selected && allSelectedIds.size > 0 ? [...allSelectedIds] : [item.id];
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  };

  const readIds = (e: React.DragEvent): string[] => {
    try {
      return JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return [];
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (searchMode || isTrash) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (item.type === 'folder' && y > rect.height * 0.25 && y < rect.height * 0.75) {
      setDropZone('over');
    } else if (y < rect.height * 0.5) {
      setDropZone('top');
    } else {
      setDropZone('bottom');
    }
  };

  const handleDragLeave = () => setDropZone(null);

  const handleDrop = (e: React.DragEvent) => {
    if (isTrash) return;
    e.preventDefault();
    const ids = readIds(e);
    const zone = dropZone;
    setDropZone(null);
    if (!ids.length || ids.includes(item.id)) return;
    if (zone === 'over' && item.type === 'folder') onDropOnFolder(ids);
    else if (zone === 'top') onReorder(ids, 'before');
    else if (zone === 'bottom') onReorder(ids, 'after');
  };

  return (
    <li
      ref={rowRef}
      data-testid={`item-row-${item.id}`}
      draggable={!searchMode && !isTrash}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={[
        'flex items-center gap-2 px-2 py-2 border-b border-neutral-100 select-none no-select',
        selected ? 'bg-neutral-100' : 'hover:bg-neutral-50',
        dropZone === 'over' ? 'dnd-over' : '',
        dropZone === 'top' ? 'border-t-2 border-t-neutral-500' : '',
        dropZone === 'bottom' ? 'border-b-2 border-b-neutral-500' : '',
      ].join(' ')}
    >
      <div className="shrink-0 flex items-center gap-2">
        {isTrash ? (
          <span className="w-5" />
        ) : selectMode ? (
          <span
            className={[
              'inline-block w-4 h-4 rounded border',
              selected ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-400 bg-white',
            ].join(' ')}
            aria-checked={selected}
            role="checkbox"
          />
        ) : item.type === 'file' ? (
          <button
            data-testid={`item-number-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenFile();
            }}
            className="w-5 text-xs text-neutral-400 text-right hover:text-neutral-900"
            title={t('file.editContent')}
          >
            {number}.
          </button>
        ) : (
          <span className="w-5 text-xs text-neutral-400 text-right">{number}.</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={[
            'text-sm truncate flex items-center gap-1.5',
            !item.content && item.type === 'file' ? 'text-neutral-500' : '',
            isTrash ? 'font-semibold text-neutral-900' : '',
          ].join(' ')}
          data-testid={`item-name-${item.id}`}
        >
          {item.type === 'folder' ? (
            <Folder size={14} className="shrink-0" strokeWidth={2} />
          ) : (
            <FileText size={14} className="shrink-0 text-neutral-400" />
          )}
          <span className="truncate flex items-center gap-1.5">
            {isTrash ? (
              <>
                <span>trash</span>
                {trashCount > 0 && (
                  <span className="text-xs text-neutral-400 font-normal">({trashCount})</span>
                )}
              </>
            ) : item.type === 'file' ? (
              `${(item.content || '').split('\n').find((l) => l.trim()) || t('file.empty')}`
            ) : (
              item.name || t('file.folder')
            )}
          </span>
        </div>
        {searchMode && pathLabel !== undefined && (
          <div className="text-[11px] text-neutral-500 truncate">{pathLabel}</div>
        )}
        {inTrash && item.deletedAt && (
          <div className="text-[11px] text-neutral-400 truncate mt-0.5">
            Dihapus: {new Date(item.deletedAt).toLocaleDateString()} {new Date(item.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      {inTrash && onRestoreTrash && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestoreTrash(item.id);
          }}
          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors mr-1"
          title="Pulihkan"
        >
          <RotateCcw size={12} />
          Pulihkan
        </button>
      )}
      {!isTrash && (
        <button
          data-testid={`item-menu-${item.id}`}
          data-no-press="1"
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onMenu(rect);
          }}
          className="p-1 hover:bg-neutral-100 rounded"
          aria-label={t('file.menu')}
        >
          <MoreVertical size={16} />
        </button>
      )}
    </li>
  );
};
