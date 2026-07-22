import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface MenuAction {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  title: string;
  actions: MenuAction[];
  onClose: () => void;
}

export const ItemMenu = ({ title, actions, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-root" onClick={onClose} data-testid="item-menu">
      <div ref={ref} className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="flex items-center justify-between p-2 border-b border-neutral-200">
          <div className="text-sm font-medium truncate pr-2">{title}</div>
          <button data-testid="menu-close-btn" onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <ul className="flex flex-col">
            {actions.map((a) => (
              <li key={a.key}>
                <button
                  data-testid={`menu-action-${a.key}`}
                  onClick={() => {
                    a.onClick();
                    onClose();
                  }}
                  className={[
                    'w-full text-left px-3 py-2 text-sm rounded hover:bg-neutral-100',
                    a.danger ? 'text-red-600' : '',
                  ].join(' ')}
                >
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
