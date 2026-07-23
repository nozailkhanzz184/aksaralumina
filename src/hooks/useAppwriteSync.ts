import { useState, useCallback, useEffect } from 'react';
import { ID, AppwriteException, Permission, Role } from 'appwrite';
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, APPWRITE_BUCKET_ID } from '../lib/appwrite';
import { toast } from 'sonner';
import { FileSystemItem } from '../Types';

export function useAppwriteSync(
  items: FileSystemItem[],
  trashItems: FileSystemItem[],
  importJSON: (jsonStr: string, replace: boolean) => Promise<void>,
  exportJSON: () => string
) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    account.get().then((res) => {
      if (!res.emailVerification) {
        account.deleteSession('current').finally(() => {
          setUser(null);
          setLoading(false);
        });
      } else {
        setUser(res);
        setLoading(false);
      }
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });
  }, []);

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      await account.updateVerification(userId, secret);
      toast.success('Email berhasil diverifikasi. Silakan masuk.', { duration: 4000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal memverifikasi email: ' + e.message, { duration: 4000 });
      return false;
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      await account.createEmailPasswordSession(email, pass);
      const acc = await account.get();
      if (!acc.emailVerification) {
        await account.createVerification(window.location.origin + '?action=verify');
        await account.deleteSession('current');
        toast.error('Email belum diverifikasi. Tautan verifikasi baru telah dikirim ke email Anda.', { duration: 5000 });
        return false;
      }
      setUser(acc);
      toast.success('Berhasil masuk', { duration: 2000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal masuk: ' + e.message, { duration: 2000 });
      return false;
    }
  };

  const register = async (email: string, pass: string) => {
    try {
      await account.create(ID.unique(), email, pass);
      await account.createEmailPasswordSession(email, pass);
      await account.createVerification(window.location.origin + '?action=verify');
      await account.deleteSession('current');
      toast.success('Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk memverifikasi akun.', { duration: 5000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal daftar: ' + e.message, { duration: 2000 });
      return false;
    }
  };

    const resetPassword = async (email: string) => {
    const LAST_OTP_KEY = 'aksaralumina:lastOtpTime';
    const lastOtp = localStorage.getItem(LAST_OTP_KEY);
    const now = Date.now();
    
    if (lastOtp && now - parseInt(lastOtp, 10) < 60 * 60 * 1000) {
      toast.error('Harap tunggu 1 jam sebelum meminta kode OTP / reset sandi lagi.', { duration: 3000 });
      return false;
    }

    try {
      await account.createRecovery(email, window.location.origin + '?action=reset');
      localStorage.setItem(LAST_OTP_KEY, now.toString());
      toast.success('Tautan reset sandi telah dikirim ke email Anda.', { duration: 3000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal mengirim tautan: ' + e.message, { duration: 3000 });
      return false;
    }
  };

  const updatePasswordRecovery = async (userId: string, secret: string, newPass: string) => {
    try {
      await account.updateRecovery(userId, secret, newPass);
      toast.success('Sandi berhasil diubah. Silakan masuk dengan sandi baru.', { duration: 3000 });
      return true;
    } catch (e: any) {
      toast.error('Gagal mengubah sandi: ' + e.message, { duration: 3000 });
      return false;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      toast.info('Keluar', { duration: 2000 });
    } catch (e: any) {
      toast.error('Gagal keluar', { duration: 2000 });
    }
  };

  const smartSync = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    const toastId = toast.loading('Menjalankan sinkronisasi cerdas...');
    try {
      let docId = user.$id;
      let cloudDoc: any = null;
      try {
        cloudDoc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId);
      } catch (err: any) {
        if (err.code !== 404 && err.code !== 403) throw err;
      }

      const localApiKey = localStorage.getItem('aksaralumina:openrouter-key') || '';
      const localModel = localStorage.getItem('aksaralumina:openrouter-model') || '';

      if (!cloudDoc) {
        const deletedIds = trashItems.map(t => t.id);
        const finalDataStr = JSON.stringify({ 
          app: 'plaintxtai', 
          version: 1, 
          items: items,
          trashItems: trashItems,
          deletedIds: deletedIds,
          apiKey: localApiKey,
          model: localModel
        });
        await databases.createDocument(
          APPWRITE_DATABASE_ID, 
          APPWRITE_COLLECTION_ID, 
          docId, 
          { 
            data: finalDataStr,
            email: user.email
          },
          [
            Permission.read(Role.user(user.$id)),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
        toast.success('Sinkronisasi Cerdas selesai: Data lokal berhasil diunggah ke awan.', { id: toastId, duration: 2500 });
        setSyncing(false);
        return;
      }

      let parsedCloud;
      try {
        parsedCloud = JSON.parse(cloudDoc.data);
      } catch {
        parsedCloud = { items: [] };
      }

      const rawCloudItems: FileSystemItem[] = Array.isArray(parsedCloud) ? parsedCloud : (Array.isArray(parsedCloud?.items) ? parsedCloud.items : []);
      const cloudItems = rawCloudItems.map(it => {
        if (it.type === 'folder' && !it.name?.trim()) {
          return { ...it, name: 'Folder' };
        }
        return it;
      });

      const cloudApiKey = parsedCloud.apiKey || '';
      const cloudModel = parsedCloud.model || '';

      const localTrashIds = new Set(trashItems.map(t => t.id));
      const cloudDeletedIds = new Set([
        ...(Array.isArray(parsedCloud.deletedIds) ? parsedCloud.deletedIds : []),
        ...((parsedCloud.trashItems || []).map((t: any) => t.id))
      ]);

      const itemMap = new Map<string, FileSystemItem>();

      for (const item of cloudItems) {
        if (localTrashIds.has(item.id) || cloudDeletedIds.has(item.id)) continue;
        itemMap.set(item.id, item);
      }

      for (const localItem of items) {
        if (localTrashIds.has(localItem.id) || cloudDeletedIds.has(localItem.id)) continue;
        const existing = itemMap.get(localItem.id);
        if (!existing) {
          itemMap.set(localItem.id, localItem);
        } else {
          const localUpdated = localItem.updatedAt || 0;
          const cloudUpdated = existing.updatedAt || 0;
          if (localUpdated >= cloudUpdated) {
            itemMap.set(localItem.id, localItem);
          } else {
            itemMap.set(localItem.id, existing);
          }
        }
      }

      const mergedItems = Array.from(itemMap.values());
      const mergedApiKey = localApiKey || cloudApiKey;
      const mergedModel = localModel || cloudModel;

      await importJSON(JSON.stringify({ items: mergedItems, trashItems, apiKey: mergedApiKey, model: mergedModel }), true);

      if (mergedApiKey) {
        localStorage.setItem('aksaralumina:openrouter-key', mergedApiKey);
      }
      if (mergedModel) {
        localStorage.setItem('aksaralumina:openrouter-model', mergedModel);
      }

      const allDeletedIds = Array.from(new Set([...trashItems.map(t => t.id), ...cloudDeletedIds]));
      const finalDataStr = JSON.stringify({ 
        app: 'plaintxtai', 
        version: 1, 
        items: mergedItems,
        trashItems: trashItems,
        deletedIds: allDeletedIds,
        apiKey: mergedApiKey,
        model: mergedModel
      });

      await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId, {
        data: finalDataStr,
        email: user.email
      });

      toast.success('Sinkronisasi Cerdas berhasil! Data lokal dan awan telah digabungkan secara optimal.', { id: toastId, duration: 3000 });
    } catch (e: any) {
      toast.error('Gagal sinkronisasi cerdas: ' + e.message, { id: toastId, duration: 3000 });
    } finally {
      setSyncing(false);
    }
  }, [user, items, importJSON]);

  const autoBackup = useCallback(async () => {
    if (!user) return;
    const LAST_BACKUP_KEY = 'aksaralumina:lastBackupTime';
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    const now = Date.now();
    
    // Check if 24 hours have passed
    if (lastBackup && now - parseInt(lastBackup, 10) < 24 * 60 * 60 * 1000) {
      return; // Not yet 24 hours
    }

    try {
      const dataStr = exportJSON();
      // Generate YYYYMMDD
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const fileName = `auto_backup_${year}${month}${day}.json`;

      const file = new File([dataStr], fileName, { type: 'application/json' });

      await storage.createFile(
        APPWRITE_BUCKET_ID,
        ID.unique(),
        file,
        [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id))
        ]
      );

      localStorage.setItem(LAST_BACKUP_KEY, now.toString());
      console.log('Auto backup berhasil');
    } catch (e: any) {
      console.error('Auto backup error', e);
      if (e.message && e.message.includes("permissions provided for action 'create'")) {
        toast.error('Gagal pencadangan otomatis: Administrator perlu memberikan izin create pada Role users di Storage Bucket Appwrite.', { duration: 2000 });
      }
    }
  }, [user, exportJSON]);

  useEffect(() => {
    if (user && !loading) {
      autoBackup();
    }
  }, [user, loading, autoBackup]);

  return {
    user,
    loading,
    syncing,
    login,
    register,
    resetPassword,
    updatePasswordRecovery,
    verifyEmail,
    logout,
    smartSync
  };
}
