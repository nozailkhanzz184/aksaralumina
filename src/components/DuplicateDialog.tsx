import { useState } from 'react';
import { FileSystemItem } from '../Types';
import { X } from 'lucide-react';

interface Props {
  duplicates: string[][];
  items: FileSystemItem[];
  onClose: () => void;
  onConfirm: (toDelete: string[]) => void;
  pathOf: (parentId: string | null) => string;
}

export const DuplicateDialog = ({ duplicates, items, onClose, onConfirm, pathOf }: Props) => {
  const [selectedToDelete, setSelectedToDelete] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    duplicates.forEach((group) => {
      // Default: select all EXCEPT the first one to be deleted
      group.forEach((id, idx) => {
        if (idx > 0) initial[id] = true;
      });
    });
    return initial;
  });

  const handleConfirm = () => {
    const toDelete = Object.keys(selectedToDelete).filter(id => selectedToDelete[id]);
    onConfirm(toDelete);
  };

  const toggleSelection = (id: string) => {
    setSelectedToDelete((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-neutral-200 shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-900">Pilih Duplikat untuk Dihapus</h2>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-neutral-900">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 text-sm text-neutral-700">
          {duplicates.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6 last:mb-0 border border-neutral-100 rounded-lg p-3">
              <p className="font-medium text-neutral-900 mb-2">Grup {groupIndex + 1}</p>
              {group.map((id) => {
                const item = items.find((i) => i.id === id);
                if (!item) return null;
                const isSelected = !!selectedToDelete[id];
                return (
                  <label key={id} className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(id)}
                    />
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-medium text-neutral-800 truncate">
                        {(item.content || '(kosong)').substring(0, 20)}
                        {(item.content || '').length > 20 ? '...' : ''}
                      </span>
                      <span className="text-xs text-neutral-500 truncate flex-shrink-0">
                        ({pathOf(item.parentId).length > 20 ? pathOf(item.parentId).substring(0, 20) + '...' : pathOf(item.parentId)})
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-100"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-950 text-white rounded hover:bg-neutral-800"
          >
            Hapus yang dipilih
          </button>
        </div>
      </div>
    </div>
  );
};
