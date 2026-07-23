import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Folder } from 'lucide-react';
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
  return (
    <ul data-testid="file-list" className="flex flex-col">
      {items.map((it, index) => (
        <Row
          key={it.id}
          number={index + 1}
          item={it}
          selected={selectedIds.has(it.id)}
          selectMode={selectMode}
          onToggleSelect={() => onToggleSelect(it.id)}
          onOpenFolder={() => onOpenFolder(it.id)}
          onCopyFile={() => onCopyFile(it)}
          onOpenFile={() => onOpenFile(it)}
          onMenu={(rect) => onMenu(it, rect)}
          onDropOnFolder={(dragged) => onDropOnFolder(it.id, dragged)}
          onReorder={(dragged, pos) => onReorder(dragged, it.id, pos)}
          allSelectedIds={selectedIds}
          searchMode={searchMode}
          pathLabel={pathOf ? pathOf(it.parentId) : undefined}
        />
      ))}
    </ul>
  );
};

interface RowProps {
  number: number;
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
}

const Row = ({
  number,
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
}: RowProps) => {
  const { t } = useI18n();
  const [dropZone, setDropZone] = useState<'over' | 'top' | 'bottom' | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);

  const handleClick = () => {
    if (selectMode) {
      onToggleSelect();
      return;
    }
    if (item.type === 'folder') onOpenFolder();
    else onCopyFile();
  };

  const handleDragStart = (e: React.DragEvent) => {
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
    if (searchMode) return;
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
      draggable={!searchMode}
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
        {selectMode ? (
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
          ].join(' ')}
          data-testid={`item-name-${item.id}`}
        >
          {item.type === 'folder' && <Folder size={14} className="shrink-0" strokeWidth={2} />}
          <span className="truncate">
            {item.type === 'file'
              ? `${(item.content || '').split('\n').find((l) => l.trim()) || t('file.empty')}`
              : item.name || t('file.folder')}
          </span>
        </div>
        {searchMode && pathLabel !== undefined && (
          <div className="text-[11px] text-neutral-500 truncate">{pathLabel}</div>
        )}
      </div>
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
    </li>
  );
};
