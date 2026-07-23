import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileSystemItem } from '../Types';
import * as db from '../db/db';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useFileSystem = () => {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    let all = await db.getAllItems();
    
    const invalidFolders = all.filter(it => it.type === 'folder' && !it.name?.trim());
    if (invalidFolders.length > 0) {
      invalidFolders.forEach(it => {
        it.name = 'Folder';
        it.updatedAt = Date.now();
      });
      await db.saveItems(invalidFolders);
      all = await db.getAllItems();
    }

    setItems(all);
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const childrenOf = useCallback(
    (pid: string | null) =>
      items
        .filter((i) => i.parentId === pid)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
          return (a.order ?? 0) - (b.order ?? 0);
        }),
    [items],
  );

  const nextOrder = (pid: string | null) => {
    const siblings = items.filter((i) => i.parentId === pid);
    return siblings.length ? Math.max(...siblings.map((s) => s.order ?? 0)) + 1 : 0;
  };

  const createItem = async (
    name: string,
    type: 'file' | 'folder',
    parentId: string | null,
    content = '',
  ): Promise<FileSystemItem> => {
    if (type === 'file' && !content.trim()) {
      throw new Error('Catatan tidak boleh kosong');
    }
    const itemName = name.trim() || (type === 'folder' ? 'Folder' : 'Untitled');
    const item: FileSystemItem = {
      id: uid(),
      parentId,
      name: itemName,
      type,
      content: type === 'file' ? content : undefined,
      order: nextOrder(parentId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.saveItem(item);
    await reload();
    return item;
  };

  const updateContent = async (id: string, content: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (!content.trim()) {
      await deleteMany([id]);
      return;
    }
    await db.saveItem({ ...it, content, updatedAt: Date.now() });
    await reload();
  };

  const renameItem = async (id: string, name: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const finalName = name.trim();
    if (!finalName && it.type === 'folder') return;
    
    if (finalName) {
      const existing = items.find((i) => i.id !== id && i.parentId === it.parentId && i.name === finalName && i.type === it.type);
      if (existing) {
        throw new Error('Nama sudah ada di folder ini');
      }
    }
    await db.saveItem({ ...it, name: finalName, updatedAt: Date.now() });
    await reload();
  };

  const collectDescendants = (rootIds: string[]): string[] => {
    const all = new Set<string>();
    const walk = (id: string) => {
      if (all.has(id)) return;
      all.add(id);
      items.filter((i) => i.parentId === id).forEach((c) => walk(c.id));
    };
    rootIds.forEach(walk);
    return [...all];
  };

  const [trashItems, setTrashItems] = useState<FileSystemItem[]>([]);

  const loadTrash = useCallback(async () => {
    try {
      const trash = await db.getAllTrashItems();
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const expiredIds: string[] = [];
      const validTrash: FileSystemItem[] = [];

      for (const item of trash) {
        const deletedTime = item.deletedAt || item.updatedAt;
        if (now - deletedTime > ONE_WEEK) {
          expiredIds.push(item.id);
        } else {
          validTrash.push(item);
        }
      }

      if (expiredIds.length > 0) {
        await db.deleteTrashItems(expiredIds);
      }
      setTrashItems(validTrash);
    } catch {
      setTrashItems([]);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const deleteMany = async (ids: string[]) => {
    const all = collectDescendants(ids);
    const now = Date.now();
    const itemsToDelete = items.filter((i) => all.includes(i.id)).map(i => ({ ...i, deletedAt: now }));
    if (itemsToDelete.length > 0) {
      await db.saveTrashItems(itemsToDelete);
      await db.deleteItems(all);
      await loadTrash();
    }
    await reload();
  };

  const restoreTrashItem = async (id: string) => {
    const trashList = await db.getAllTrashItems();
    const item = trashList.find((i) => i.id === id);
    if (!item) return;

    const allActive = await db.getAllItems();
    const parentExists = item.parentId === null || allActive.some((i) => i.id === item.parentId);
    const restoredItem = {
      ...item,
      parentId: parentExists ? item.parentId : null,
      updatedAt: Date.now(),
      deletedAt: undefined
    };

    await db.saveItem(restoredItem);
    await db.deleteTrashItems([id]);
    await loadTrash();
    await reload();
  };

  const permanentDeleteTrashItem = async (id: string) => {
    await db.deleteTrashItems([id]);
    await loadTrash();
  };

  const emptyTrash = async () => {
    const trash = await db.getAllTrashItems();
    if (trash.length > 0) {
      await db.deleteTrashItems(trash.map(t => t.id));
      await loadTrash();
    }
  };

  const isDescendant = (ancestorId: string, nodeId: string): boolean => {
    let cur = items.find((i) => i.id === nodeId);
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return false;
  };

  const moveMany = async (ids: string[], targetParentId: string | null) => {
    const validIds = ids.filter((id) => {
      if (id === targetParentId) return false;
      const it = items.find((i) => i.id === id);
      if (!it) return false;
      if (it.type === 'folder' && targetParentId && isDescendant(id, targetParentId)) return false;
      return true;
    });
    const targetSiblings = items.filter((i) => i.parentId === targetParentId);
    let base = targetSiblings.length ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0;
    const updated: FileSystemItem[] = [];
    validIds.forEach((id) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;
      updated.push({ ...it, parentId: targetParentId, order: base++, updatedAt: Date.now() });
    });
    if (updated.length) {
      await db.saveItems(updated);
      await reload();
    }
  };

  const copyMany = async (ids: string[], targetParentId: string | null) => {
    // Deep copy the subtree of each id under target.
    const all = collectDescendants(ids);
    const map: Record<string, string> = {};
    const now = Date.now();
    const targetSiblings = items.filter((i) => i.parentId === targetParentId);
    let base = targetSiblings.length ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0;

    // First pass: assign new IDs
    all.forEach((id) => (map[id] = uid()));

    const copies: FileSystemItem[] = all.map((id) => {
      const it = items.find((i) => i.id === id)!;
      const isRoot = ids.includes(id);
      return {
        ...it,
        id: map[id],
        parentId: isRoot ? targetParentId : map[it.parentId!] ?? targetParentId,
        order: isRoot ? base++ : it.order,
        createdAt: now,
        updatedAt: now,
      };
    });
    await db.saveItems(copies);
    await reload();
  };

  const duplicateItem = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    await copyMany([id], it.parentId);
  };

  const reorderInParent = async (parentId: string | null, orderedIds: string[]) => {
    const updated: FileSystemItem[] = [];
    orderedIds.forEach((id, idx) => {
      const it = items.find((i) => i.id === id);
      if (it && it.parentId === parentId) {
        updated.push({ ...it, order: idx, updatedAt: Date.now() });
      }
    });
    if (updated.length) {
      await db.saveItems(updated);
      await reload();
    }
  };

  const getBreadcrumbs = useCallback((): FileSystemItem[] => {
    const crumbs: FileSystemItem[] = [];
    let cur = items.find((i) => i.id === currentFolderId);
    while (cur) {
      crumbs.unshift(cur);
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return crumbs;
  }, [items, currentFolderId]);

  const currentItems = useMemo(() => childrenOf(currentFolderId), [childrenOf, currentFolderId]);

  const searchItems = useCallback(
    (q: string): FileSystemItem[] => {
      const query = q.trim().toLowerCase();
      if (!query) return [];
      return items
        .filter((i) => {
          if (i.name.toLowerCase().includes(query)) return true;
          if (i.type === 'file' && i.content && i.content.toLowerCase().includes(query)) return true;
          return false;
        })
        .sort((a, b) => {
          const nameA = a.type === 'file' ? (a.content || '').trim() : a.name;
          const nameB = b.type === 'file' ? (b.content || '').trim() : b.name;
          return nameA.localeCompare(nameB);
        });
    },
    [items],
  );

  const pathOf = useCallback(
    (id: string | null): string => {
      if (!id) return '/';
      const parts: string[] = [];
      let cur = items.find((i) => i.id === id);
      while (cur) {
        parts.unshift(cur.name);
        cur = items.find((i) => i.id === cur!.parentId);
      }
      return '/' + parts.join('/');
    },
    [items],
  );

  const exportJSON = () => {
    const aiKey = localStorage.getItem('aksaralumina:openrouter-key') || '';
    const aiModel = localStorage.getItem('aksaralumina:openrouter-model') || '';
    return JSON.stringify({ app: 'plaintxtai', version: 1, items, trashItems, apiKey: aiKey, model: aiModel }, null, 2);
  };



  const importJSON = async (json: string, replace: boolean) => {
    const data = JSON.parse(json);
    const incoming: FileSystemItem[] = Array.isArray(data) ? data : data.items || [];
    const incomingTrash: FileSystemItem[] = Array.isArray(data.trashItems) ? data.trashItems : [];
    
    if (data.apiKey) {
      if (replace || !localStorage.getItem('aksaralumina:openrouter-key')) {
        localStorage.setItem('aksaralumina:openrouter-key', data.apiKey);
      }
    }
    if (data.model) {
      if (replace || !localStorage.getItem('aksaralumina:openrouter-model')) {
        localStorage.setItem('aksaralumina:openrouter-model', data.model);
      }
    }

    if (incomingTrash.length > 0) {
      if (replace) {
        // clear trash will be done via clearAll or saving
      }
      await db.saveTrashItems(incomingTrash);
      await loadTrash();
    }

    await importItems(incoming, replace);
  };

  const importItems = async (incoming: FileSystemItem[], replace: boolean) => {
    if (replace) {
      await db.clearAll();
      await db.saveItems(incoming);
      try {
        localStorage.removeItem('aksaralumina:deletedIds');
      } catch (e) {}
    } else {
      // Merge: reassign new IDs to avoid collisions and place under root when parent missing
      const map: Record<string, string> = {};
      incoming.forEach((it) => (map[it.id] = uid()));
      const incomingIds = new Set(incoming.map((it) => it.id));
      const remapped = incoming.map((it) => ({
        ...it,
        id: map[it.id],
        parentId: it.parentId && incomingIds.has(it.parentId) ? map[it.parentId] : null,
      }));
      await db.saveItems(remapped);
    }
    await reload();
  };

  const clearAll = useCallback(async () => {
    await db.clearAll();
    setItems([]);
    setTrashItems([]);
    setCurrentFolderId(null);
    try {
      localStorage.removeItem('aksaralumina:deletedIds');
    } catch (e) {}
  }, []);

  return {
    items,
    loaded,
    currentItems,
    currentFolderId,
    setCurrentFolderId,
    childrenOf,
    createItem,
    updateContent,
    renameItem,
    deleteMany,
    moveMany,
    copyMany,
    duplicateItem,
    reorderInParent,
    getBreadcrumbs,
    searchItems,
    pathOf,
    exportJSON,
    importJSON,
    importItems,
    isDescendant,
    clearAll,
    trashItems,
    restoreTrashItem,
    permanentDeleteTrashItem,
    emptyTrash,
  };
};
